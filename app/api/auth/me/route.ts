import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, sanitizeUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        return NextResponse.json({ user: sanitizeUser(user) });
    } catch (error) {
        console.error('[auth/me GET]', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
