import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { Notification } from '@/models/Notification';
import { resolveChannelWorkspace, assertWorkspaceMember } from '@/lib/guards';

const PAGE_SIZE = 50;
const MENTION_PATTERN = /(^|\s)@([a-zA-Z0-9_-]{2,32})/g;

function extractMentions(content: string) {
    const usernames = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = MENTION_PATTERN.exec(content)) !== null) {
        usernames.add(match[2].toLowerCase());
    }
    return Array.from(usernames);
}

// GET /api/channels/[id]/messages?cursor=<lastMessageId>&threadId=<id>
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {

        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Membership check
        const workspaceId = await resolveChannelWorkspace(params.id);
        await assertWorkspaceMember(user._id.toString(), workspaceId);

        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');
        const threadId = searchParams.get('threadId');

        const query: Record<string, unknown> = { channelId: params.id };
        if (threadId) {
            query.threadId = threadId;
        } else {
            query.threadId = { $exists: false };
        }
        if (cursor) {
            query._id = { $lt: cursor };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(PAGE_SIZE)
            .populate('senderId', 'username avatarColor email')
            .lean();

        return NextResponse.json({ messages: messages.reverse() });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[messages GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST /api/channels/[id]/messages  — persist a new message
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {

        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Membership check
        const workspaceId = await resolveChannelWorkspace(params.id);
        await assertWorkspaceMember(user._id.toString(), workspaceId);

        const body = await req.json();
        const { content, type = 'text', threadId } = body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const messageData: Record<string, unknown> = {
            channelId: params.id,
            senderId: user._id,
            content: content.slice(0, 10000),
            type,
        };
        if (threadId) messageData.threadId = threadId;

        const message = await Message.create(messageData);
        const populated = await message.populate('senderId', 'username avatarColor email');

        // Emit via Socket.io
        if (global.io) {
            global.io.to(`channel:${params.id}`).emit('message:new', populated.toObject());
        }

        // Persist mention notifications and emit per-user updates.
        const mentions = extractMentions(content);
        if (mentions.length > 0) {
            try {
                const workspace = await Workspace.findById(workspaceId).select('members').lean();
                const workspaceMemberIds = (workspace?.members ?? []).map((id) => id.toString());

                if (workspaceMemberIds.length > 0) {
                    const recipients = await User.find({
                        _id: { $in: workspaceMemberIds, $ne: user._id },
                        usernameLowercase: { $in: mentions },
                    })
                        .select('_id username avatarColor')
                        .lean();

                    if (recipients.length > 0) {
                        const createdNotifications = await Notification.insertMany(
                            recipients.map((recipient) => ({
                                recipientId: recipient._id,
                                type: 'mention',
                                messageId: message._id,
                                channelId: params.id,
                                senderId: user._id,
                            }))
                        );

                        if (global.io) {
                            const sender = {
                                username: user.username,
                                avatarColor: user.avatarColor,
                            };

                            for (const notification of createdNotifications) {
                                global.io
                                    .to(`user:${notification.recipientId.toString()}`)
                                    .emit('notification:mention', {
                                        _id: notification._id.toString(),
                                        type: notification.type,
                                        read: notification.read,
                                        senderId: sender,
                                        createdAt: notification.createdAt,
                                    });
                            }
                        }
                    }
                }
            } catch (mentionErr) {
                console.error('[messages POST mention notifications]', mentionErr);
            }
        }

        return NextResponse.json({ message: populated }, { status: 201 });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[messages POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
