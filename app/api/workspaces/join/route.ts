import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';

// POST /api/workspaces/join  — join via invite token
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const guestId = req.cookies.get('guestId')?.value;
        if (!guestId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findOne({ guestId });
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { inviteToken } = await req.json();
        if (!inviteToken) return NextResponse.json({ error: 'inviteToken is required' }, { status: 400 });

        const workspace = await Workspace.findOne({ inviteToken });
        if (!workspace) return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });

        await Workspace.findByIdAndUpdate(workspace._id, { $addToSet: { members: user._id } });
        await User.findByIdAndUpdate(user._id, { $addToSet: { workspaces: workspace._id } });

        return NextResponse.json({ workspace });
    } catch (err) {
        console.error('[workspaces/join POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
