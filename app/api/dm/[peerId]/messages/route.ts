import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Message } from '@/models/Message';
import { Types } from 'mongoose';
import { User } from '@/models/User';
import { assertUsersShareWorkspace } from '@/lib/guards';

const PAGE_SIZE = 50;

// GET /api/dm/[peerId]/messages
export async function GET(req: NextRequest, { params }: { params: { peerId: string } }) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!Types.ObjectId.isValid(params.peerId)) {
            return NextResponse.json({ error: 'Invalid peerId' }, { status: 400 });
        }

        const peerExists = await User.exists({ _id: params.peerId });
        if (!peerExists) {
            return NextResponse.json({ error: 'Peer not found' }, { status: 404 });
        }

        await assertUsersShareWorkspace(user._id.toString(), params.peerId);

        const dmPairId = [user._id.toString(), params.peerId].sort().join('-');
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');

        const query: Record<string, unknown> = { dmPairId };
        if (cursor) query._id = { $lt: cursor };

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
        console.error('[dm messages GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST /api/dm/[peerId]/messages
export async function POST(req: NextRequest, { params }: { params: { peerId: string } }) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!Types.ObjectId.isValid(params.peerId)) {
            return NextResponse.json({ error: 'Invalid peerId' }, { status: 400 });
        }

        const peerExists = await User.exists({ _id: params.peerId });
        if (!peerExists) {
            return NextResponse.json({ error: 'Peer not found' }, { status: 404 });
        }

        await assertUsersShareWorkspace(user._id.toString(), params.peerId);

        const { content } = await req.json();
        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const dmPairId = [user._id.toString(), params.peerId].sort().join('-');
        const message = await Message.create({
            dmPairId,
            senderId: user._id,
            content: content.slice(0, 10000),
            type: 'text',
        });
        const populated = await message.populate('senderId', 'username avatarColor email');

        if (global.io) {
            const room = `dm:${dmPairId}`;
            global.io.to(room).emit('message:new', populated.toObject());
        }

        return NextResponse.json({ message: populated }, { status: 201 });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[dm messages POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
