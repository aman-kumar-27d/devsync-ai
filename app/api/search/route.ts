import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Message } from '@/models/Message';
import { Snippet } from '@/models/Snippet';
import { File } from '@/models/File';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

type SearchType = 'messages' | 'snippets' | 'files' | 'users' | 'all';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

        if (type === 'users' || type === 'all') {
            const workspaceMembershipQuery = workspaceId ? { workspaces: workspaceId } : {};
            const loweredQuery = q.toLowerCase();
            const userMatches: Array<{ _id: mongoose.Types.ObjectId; username: string; email: string; avatarColor: string }> = [];

            if (mongoose.Types.ObjectId.isValid(q)) {
                const exactUser = await User.findOne({ _id: q, ...workspaceMembershipQuery })
                    .select('_id username email avatarColor')
                    .lean();
                if (exactUser) userMatches.push(exactUser);
            }

            const regexMatches = await User.find({
                ...workspaceMembershipQuery,
                usernameLowercase: { $regex: `^${loweredQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
            })
                .select('_id username email avatarColor')
                .sort({ usernameLowercase: 1 })
                .limit(20)
                .lean();

            const mergedUsers = [...userMatches, ...regexMatches].filter(
                (candidate, index, list) => index === list.findIndex((item) => item._id?.toString() === candidate._id?.toString())
            );

            results.users = mergedUsers;
        }

        return NextResponse.json({ results });
    } catch (err) {
        console.error('[search GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
