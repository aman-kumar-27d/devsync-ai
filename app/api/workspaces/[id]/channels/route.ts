import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Channel } from '@/models/Channel';
import { Workspace } from '@/models/Workspace';

// POST /api/workspaces/[id]/channels  — create a channel
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { error } = await requireAuthUser(req);
        if (error) return error;

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
