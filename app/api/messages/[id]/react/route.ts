import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Message } from '@/models/Message';
import { resolveChannelWorkspace, assertWorkspaceMember } from '@/lib/guards';

// POST /api/messages/[id]/react  — toggle a reaction emoji
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { emoji } = await req.json();
        if (!emoji || typeof emoji !== 'string') {
            return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
        }

        const message = await Message.findById(params.id);
        if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (message.channelId) {
            const workspaceId = await resolveChannelWorkspace(message.channelId.toString());
            await assertWorkspaceMember(user._id.toString(), workspaceId);
        }

        const existing = message.reactions.find((r) => r.emoji === emoji);
        if (existing) {
            const idx = existing.userIds.findIndex((id) => id.toString() === user._id.toString());
            if (idx >= 0) {
                existing.userIds.splice(idx, 1);
                if (existing.userIds.length === 0) {
                    message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
                }
            } else {
                existing.userIds.push(user._id);
            }
        } else {
            message.reactions.push({ emoji, userIds: [user._id] });
        }

        await message.save();

        if (global.io) {
            global.io.to(`channel:${message.channelId}`).emit('message:reacted', {
                _id: params.id,
                reactions: message.reactions,
                channelId: message.channelId,
            });
        }

        return NextResponse.json({ reactions: message.reactions });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[react POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
