import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { applyAuthCookie, hashPassword, sanitizeUser } from '@/lib/auth';
import { ensureDefaultWorkspace, getRandomAvatarColor } from '@/lib/userDefaults';
import { User } from '@/models/User';
import { Workspace } from '@/models/Workspace';
import { buildRateLimitKey, checkRateLimit, getRequestIp } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, password, username } = await req.json();
        const requestIp = getRequestIp(req);

        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedUsername = typeof username === 'string' ? username.trim() : '';
        const usernameLowercase = normalizedUsername.toLowerCase();

        if (!normalizedEmail || !password || !normalizedUsername) {
            return NextResponse.json({ error: 'Email, username, and password are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        if (!/^[a-zA-Z0-9_-]{3,24}$/.test(normalizedUsername)) {
            return NextResponse.json({ error: 'Username must be 3-24 chars and use letters, numbers, _ or -' }, { status: 400 });
        }

        const ipRateLimit = await checkRateLimit({
            key: buildRateLimitKey('auth_register_ip', requestIp),
            limit: 5,
            windowSeconds: 60 * 60,
        });
        if (!ipRateLimit.allowed) {
            return NextResponse.json({ error: 'Too many registration attempts from this network. Please try again later.' }, { status: 429 });
        }

        const emailRateLimit = await checkRateLimit({
            key: buildRateLimitKey('auth_register_email', `${normalizedEmail}:${requestIp}`),
            limit: 3,
            windowSeconds: 60 * 60,
        });
        if (!emailRateLimit.allowed) {
            return NextResponse.json({ error: 'Too many registration attempts for this email. Please try again later.' }, { status: 429 });
        }

        const existing = await User.findOne({
            $or: [{ email: normalizedEmail }, { usernameLowercase }],
        }).lean();

        if (existing) {
            return NextResponse.json({ error: 'Email or username is already in use' }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const defaultWorkspace = await ensureDefaultWorkspace();
        if (!defaultWorkspace) {
            return NextResponse.json({ error: 'Failed to initialize workspace' }, { status: 500 });
        }

        const userPayload = {
            email: normalizedEmail,
            username: normalizedUsername,
            usernameLowercase,
            passwordHash,
            avatarColor: getRandomAvatarColor(),
            workspaces: [defaultWorkspace._id],
        };

        let user;
        try {
            user = await User.create(userPayload);
        } catch (error) {
            const mongoError = error as { code?: number; keyPattern?: Record<string, number> };
            if (mongoError.code !== 11000 || !mongoError.keyPattern?.guestId) {
                throw error;
            }

            await User.collection.dropIndex('guestId_1').catch(() => null);
            user = await User.create(userPayload);
        }

        await Workspace.findByIdAndUpdate(defaultWorkspace._id, {
            $addToSet: { members: user._id },
        });

        const response = NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
        return applyAuthCookie(response, user);
    } catch (error) {
        console.error('[auth/register POST]', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
