import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { Channel } from '@/models/Channel';

// Adjectives and nouns for fun guest names
const adjectives = ['swift', 'clever', 'bold', 'bright', 'calm', 'eager', 'brave', 'keen', 'wise', 'cool'];
const nouns = ['coder', 'builder', 'hacker', 'dev', 'ninja', 'wizard', 'fox', 'hawk', 'wolf', 'byte'];

function randomUsername() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `${adj}-${noun}-${num}`;
}

const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

// POST /api/auth/guest  — called on first visit; idempotent via cookie
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // Check if caller already has a guestId cookie
        const existingGuestId = req.cookies.get('guestId')?.value;
        if (existingGuestId) {
            const existing = await User.findOne({ guestId: existingGuestId }).lean();
            if (existing) {
                return NextResponse.json({ user: existing });
            }
        }

        const guestId = uuidv4();
        const username = randomUsername();
        const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

        // Ensure a default workspace exists
        let defaultWorkspace = await Workspace.findOne({ name: 'General' }).lean();
        if (!defaultWorkspace) {
            defaultWorkspace = await Workspace.create({
                name: 'General',
                ownerId: new (await import('mongoose')).default.Types.ObjectId(),
                members: [],
                channels: [],
                inviteToken: uuidv4(),
            });

            const generalChannel = await Channel.create({
                workspaceId: defaultWorkspace._id,
                name: 'general',
                type: 'text' as const,
            });
            const randomChannel = await Channel.create({
                workspaceId: defaultWorkspace._id,
                name: 'random',
                type: 'text' as const,
            });

            await Workspace.findByIdAndUpdate(defaultWorkspace._id, {
                $set: { channels: [generalChannel._id, randomChannel._id] },
            });

            defaultWorkspace = await Workspace.findById(defaultWorkspace._id).lean();
        }

        if (!defaultWorkspace) {
            return NextResponse.json({ error: 'Failed to initialize default workspace' }, { status: 500 });
        }

        const user = await User.create({
            guestId,
            username,
            avatarColor,
            workspaces: [defaultWorkspace._id],
        });

        // Add user to workspace members
        await Workspace.findByIdAndUpdate(defaultWorkspace._id, {
            $addToSet: { members: user._id },
        });

        const response = NextResponse.json({ user });
        response.cookies.set('guestId', guestId, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        return response;
    } catch (err) {
        console.error('[guest auth]', err);
        return NextResponse.json({ error: 'Failed to create guest session' }, { status: 500 });
    }
}

// GET /api/auth/guest  — returns current user from cookie
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const guestId = req.cookies.get('guestId')?.value;
        if (!guestId) {
            return NextResponse.json({ user: null }, { status: 401 });
        }
        const user = await User.findOne({ guestId }).lean();
        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }
        return NextResponse.json({ user });
    } catch (err) {
        console.error('[guest get]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
