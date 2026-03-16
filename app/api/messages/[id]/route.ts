import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Message } from '@/models/Message';
import { resolveChannelWorkspace, assertWorkspaceMember } from '@/lib/guards';

// PATCH /api/messages/[id]  — edit message
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();

        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { content } = await req.json();
        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const message = await Message.findOne({ _id: params.id, senderId: user._id });
        if (!message) return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
        if (message.deletedAt) return NextResponse.json({ error: 'Cannot edit a deleted message' }, { status: 400 });

        // Membership check (channel message only)
        if (message.channelId) {
            const workspaceId = await resolveChannelWorkspace(message.channelId.toString());
            await assertWorkspaceMember(user._id.toString(), workspaceId);
        }

        message.content = content.slice(0, 10000);
        message.editedAt = new Date();
        await message.save();

        if (global.io) {
            global.io.to(`channel:${message.channelId}`).emit('message:edited', {
                _id: params.id,
                content: message.content,
                editedAt: message.editedAt,
                channelId: message.channelId,
            });
        }

        return NextResponse.json({ message });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[message PATCH]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE /api/messages/[id]  — soft-delete
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();

        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const message = await Message.findOne({ _id: params.id, senderId: user._id });
        if (!message) return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });

        // Membership check (channel message only)
        if (message.channelId) {
            const workspaceId = await resolveChannelWorkspace(message.channelId.toString());
            await assertWorkspaceMember(user._id.toString(), workspaceId);
        }

        message.deletedAt = new Date();
        await message.save();

        if (global.io) {
            global.io.to(`channel:${message.channelId}`).emit('message:deleted', {
                _id: params.id,
                channelId: message.channelId,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[message DELETE]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST /api/messages/[id]/react  — handled at /api/messages/[id]/react/route.ts
