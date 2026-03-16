import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { Snippet } from '@/models/Snippet';
import { File } from '@/models/File';
import { User } from '@/models/User';

type SearchType = 'messages' | 'snippets' | 'files' | 'all';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const guestId = req.cookies.get('guestId')?.value;
        if (!guestId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await User.findOne({ guestId }).lean();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q')?.trim();
        const type = (searchParams.get('type') ?? 'all') as SearchType;
        const workspaceId = searchParams.get('workspaceId');

        if (!q || q.length < 2) {
            return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
        }

        // Sanitize: use $text search (no direct injection risk); workspaceId via ObjectId filter
        const results: Record<string, unknown[]> = {};

        if (type === 'messages' || type === 'all') {
            results.messages = await Message.find(
                { $text: { $search: q } },
                { score: { $meta: 'textScore' } }
            )
                .sort({ score: { $meta: 'textScore' } })
                .limit(20)
                .populate('senderId', 'username avatarColor')
                .lean();
        }

        if (type === 'snippets' || type === 'all') {
            const snippetQuery: Record<string, unknown> = { $text: { $search: q } };
            if (workspaceId) snippetQuery.workspaceId = workspaceId;
            results.snippets = await Snippet.find(snippetQuery, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(20)
                .lean();
        }

        if (type === 'files' || type === 'all') {
            const fileQuery: Record<string, unknown> = { $text: { $search: q } };
            if (workspaceId) fileQuery.workspaceId = workspaceId;
            results.files = await File.find(fileQuery, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(20)
                .lean();
        }

        return NextResponse.json({ results });
    } catch (err) {
        console.error('[search GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
