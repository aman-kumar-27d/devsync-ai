import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { assertWorkspaceMember } from '@/lib/guards';
import { Message } from '@/models/Message';
import { Snippet } from '@/models/Snippet';
import { Channel } from '@/models/Channel';

export const dynamic = 'force-dynamic';

// GET /api/export?channelId=<id>&format=json|markdown&limit=200
// Exports messages (and linked snippets) for a channel the caller is a member of.

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const channelId = searchParams.get('channelId');
        const format = searchParams.get('format') ?? 'json';
        const limit = Math.min(Number(searchParams.get('limit') ?? '200'), 500);

        if (!channelId || !mongoose.isValidObjectId(channelId)) {
            return NextResponse.json({ error: 'Valid channelId is required' }, { status: 400 });
        }
        if (format !== 'json' && format !== 'markdown') {
            return NextResponse.json({ error: 'format must be json or markdown' }, { status: 400 });
        }

        const channel = await Channel.findById(channelId).lean();
        if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

        await assertWorkspaceMember(user._id.toString(), channel.workspaceId.toString());

        const messages = await Message.find({ channelId, deletedAt: { $exists: false } })
            .sort({ createdAt: 1 })
            .limit(limit)
            .populate<{ senderId: { username: string } }>('senderId', 'username')
            .lean();

        const snippetIds = messages
            .filter((m) => m.type === 'code')
            .map((m) => m._id);
        const snippets = snippetIds.length
            ? await Snippet.find({ messageId: { $in: snippetIds } }).lean()
            : [];

        const snippetByMsgId = new Map(snippets.map((s) => [s.messageId.toString(), s]));

        if (format === 'json') {
            const payload = messages.map((m) => {
                const base = {
                    id: m._id.toString(),
                    author: (m.senderId as unknown as { username: string })?.username ?? 'unknown',
                    content: m.content,
                    type: m.type,
                    createdAt: m.createdAt,
                    editedAt: m.editedAt ?? null,
                };
                const snip = snippetByMsgId.get(m._id.toString());
                if (snip) {
                    return { ...base, snippet: { language: snip.language, code: snip.code } };
                }
                return base;
            });
            return NextResponse.json({ channel: channelId, count: payload.length, messages: payload });
        }

        // Markdown export
        const lines: string[] = [`# Channel Export\n\n**Channel ID:** ${channelId}\n\n---\n`];
        for (const m of messages) {
            const author = (m.senderId as unknown as { username: string })?.username ?? 'unknown';
            const ts = new Date(m.createdAt).toISOString();
            lines.push(`### ${author}  \`${ts}\``);
            const snip = snippetByMsgId.get(m._id.toString());
            if (snip) {
                lines.push(`\n\`\`\`${snip.language}\n${snip.code}\n\`\`\``);
            } else {
                lines.push(`\n${m.content}`);
            }
            lines.push('\n');
        }

        const md = lines.join('\n');
        return new NextResponse(md, {
            status: 200,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Content-Disposition': `attachment; filename="export-${channelId}.md"`,
            },
        });
    } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('[export GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
