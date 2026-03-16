import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Channel } from '@/models/Channel';
import { Workspace } from '@/models/Workspace';
import { assertWorkspaceMember, assertWorkspaceOwner } from '@/lib/guards';

// POST /api/workspaces/[id]/channels  — create a channel
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error) return error;

        const { name, type = 'text' } = await req.json();
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
        }

        // Membership check
        await assertWorkspaceMember(user._id.toString(), params.id);
        // Owner-only channel creation
        await assertWorkspaceOwner(user._id.toString(), params.id);

        const channel = await Channel.create({
            workspaceId: params.id,
            name: name.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40),
            type,
        });

        await Workspace.findByIdAndUpdate(params.id, { $push: { channels: channel._id } });

        return NextResponse.json({ channel }, { status: 201 });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[channels POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
