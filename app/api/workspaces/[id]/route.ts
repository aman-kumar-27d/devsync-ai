import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Workspace } from '@/models/Workspace';

// GET /api/workspaces/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const workspace = await Workspace.findById(params.id)
            .populate('channels', 'name type')
            .populate('members', 'username avatarColor email')
            .lean();

        if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (!workspace.members.some((member) => member._id.toString() === user._id.toString())) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ workspace });
    } catch (err) {
        console.error('[workspace GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
