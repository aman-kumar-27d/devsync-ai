import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { applyAuthCookie, sanitizeUser, verifyPassword } from '@/lib/auth';
import { User } from '@/models/User';
import { buildRateLimitKey, checkRateLimit, getRequestIp } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, password } = await req.json();
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const requestIp = getRequestIp(req);

        if (!normalizedEmail || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const rateLimit = await checkRateLimit({
            key: buildRateLimitKey('auth_login', `${normalizedEmail}:${requestIp}`),
            limit: 10,
            windowSeconds: 60,
        });

        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many login attempts. Please try again shortly.' }, { status: 429 });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        user.lastSeen = new Date();
        await user.save();

        const response = NextResponse.json({ user: sanitizeUser(user) });
        return applyAuthCookie(response, user);
    } catch (error) {
        console.error('[auth/login POST]', error);
        return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
    }
}
