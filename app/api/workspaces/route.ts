import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Workspace } from '@/models/Workspace';
import { Channel } from '@/models/Channel';
import { User } from '@/models/User';

// GET /api/workspaces  — list workspaces for current user
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const workspaces = await Workspace.find({ members: user._id })
            .populate('channels', 'name type')
            .lean();

        return NextResponse.json({ workspaces });
    } catch (err) {
        console.error('[workspaces GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST /api/workspaces  — create a new workspace
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name } = await req.json();
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
        }

        const workspace = await Workspace.create({
            name: name.trim().slice(0, 50),
            ownerId: user._id,
            members: [user._id],
            channels: [],
            inviteToken: uuidv4(),
        });

        const general = await Channel.create({
            workspaceId: workspace._id,
            name: 'general',
            type: 'text' as const,
        });

        await Workspace.findByIdAndUpdate(workspace._id, { $set: { channels: [general._id] } });
        await User.findByIdAndUpdate(user._id, { $addToSet: { workspaces: workspace._id } });

        return NextResponse.json({ workspace }, { status: 201 });
    } catch (err) {
        console.error('[workspaces POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
