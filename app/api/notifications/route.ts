import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Notification } from '@/models/Notification';

// GET /api/notifications  — fetch unread for current user
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const notifications = await Notification.find({ recipientId: user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('senderId', 'username avatarColor')
            .lean();

        return NextResponse.json({ notifications });
    } catch (err) {
        console.error('[notifications GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PATCH /api/notifications  — mark all as read
export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await Notification.updateMany({ recipientId: user._id, read: false }, { read: true });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[notifications PATCH]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
