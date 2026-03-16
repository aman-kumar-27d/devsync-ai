import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { User } from '@/models/User';

const PAGE_SIZE = 50;

// GET /api/dm/[peerId]/messages
export async function GET(req: NextRequest, { params }: { params: { peerId: string } }) {
    try {
        await connectDB();
        const guestId = req.cookies.get('guestId')?.value;
        if (!guestId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findOne({ guestId }).lean();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const dmPairId = [user._id.toString(), params.peerId].sort().join('-');
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get('cursor');

        const query: Record<string, unknown> = { dmPairId };
        if (cursor) query._id = { $lt: cursor };

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(PAGE_SIZE)
            .populate('senderId', 'username avatarColor guestId')
            .lean();

        return NextResponse.json({ messages: messages.reverse() });
    } catch (err) {
        console.error('[dm messages GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST /api/dm/[peerId]/messages
export async function POST(req: NextRequest, { params }: { params: { peerId: string } }) {
    try {
        await connectDB();
        const guestId = req.cookies.get('guestId')?.value;
        if (!guestId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findOne({ guestId });
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        const populated = await message.populate('senderId', 'username avatarColor guestId');

        if (global.io) {
            const room = `dm:${dmPairId}`;
            global.io.to(room).emit('message:new', populated.toObject());
        }

        return NextResponse.json({ message: populated }, { status: 201 });
    } catch (err) {
        console.error('[dm messages POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
