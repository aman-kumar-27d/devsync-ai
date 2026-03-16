import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { applyAuthCookie, sanitizeUser, verifyPassword } from '@/lib/auth';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, password } = await req.json();
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!normalizedEmail || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
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
