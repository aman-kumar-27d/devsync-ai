import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import { User, type IUser } from '@/models/User';

const AUTH_COOKIE_NAME = 'authToken';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
const JWT_SECRET = process.env.JWT_SECRET || 'devcollab-ai-local-jwt-secret';

interface AuthTokenPayload {
    userId: string;
    email: string;
}

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
    return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(payload: AuthTokenPayload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch {
        return null;
    }
}

export function getTokenFromRequest(req: NextRequest) {
    return req.cookies.get(AUTH_COOKIE_NAME)?.value;
}

export async function getAuthUserFromRequest(req: NextRequest) {
    await connectDB();
    const token = getTokenFromRequest(req);
    if (!token) return null;

    const payload = verifyAuthToken(token);
    if (!payload?.userId) return null;

    return User.findById(payload.userId);
}

export async function requireAuthUser(req: NextRequest) {
    const user = await getAuthUserFromRequest(req);
    if (!user) {
        return {
            user: null,
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    return { user, error: null };
}

export function applyAuthCookie(response: NextResponse, user: Pick<IUser, '_id' | 'email'>) {
    const token = signAuthToken({ userId: user._id.toString(), email: user.email });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: TOKEN_MAX_AGE,
    });

    return response;
}

export function clearAuthCookie(response: NextResponse) {
    response.cookies.set(AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });

    return response;
}

export function sanitizeUser(user: Pick<IUser, '_id' | 'email' | 'username' | 'avatarColor' | 'workspaces'>) {
    return {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatarColor: user.avatarColor,
        workspaces: user.workspaces,
    };
}
