import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Message } from '@/models/Message';

const PAGE_SIZE = 50;

// GET /api/channels/[id]/messages?cursor=<lastMessageId>&threadId=<id>
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { error } = await requireAuthUser(req);
        if (error) return error;

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

        return NextResponse.json({ message: populated }, { status: 201 });
    } catch (err) {
        console.error('[messages POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
