import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Workspace } from '@/models/Workspace';
import { Channel } from '@/models/Channel';
import { User } from '@/models/User';

// GET /api/workspaces/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const workspace = await Workspace.findById(params.id).lean();

        if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (!workspace.members.some((member) => member.toString() === user._id.toString())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const [channels, members] = await Promise.all([
            Channel.find({ _id: { $in: workspace.channels } }).select('name type').lean(),
            User.find({ _id: { $in: workspace.members } }).select('username avatarColor email').lean(),
        ]);

        return NextResponse.json({ workspace: { ...workspace, channels, members } });
    } catch (err) {
        console.error('[workspace GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
