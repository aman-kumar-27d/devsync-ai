import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';

// GET /api/workspaces/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const guestId = req.cookies.get('guestId')?.value;
        if (!guestId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findOne({ guestId }).lean();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const workspace = await Workspace.findById(params.id)
            .populate('channels', 'name type')
            .populate('members', 'username avatarColor guestId')
            .lean();

        if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({ workspace });
    } catch (err) {
        console.error('[workspace GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
