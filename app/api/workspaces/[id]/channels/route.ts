import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Channel } from '@/models/Channel';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';

// POST /api/workspaces/[id]/channels  — create a channel
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const guestId = req.cookies.get('guestId')?.value;
        if (!guestId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findOne({ guestId }).lean();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, type = 'text' } = await req.json();
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
        }

        const workspace = await Workspace.findById(params.id);
        if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

        const channel = await Channel.create({
            workspaceId: params.id,
            name: name.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40),
            type,
        });

        await Workspace.findByIdAndUpdate(params.id, { $push: { channels: channel._id } });

        return NextResponse.json({ channel }, { status: 201 });
    } catch (err) {
        console.error('[channels POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
