import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { assertWorkspaceMember } from '@/lib/guards';
import { Message } from '@/models/Message';
import { Channel } from '@/models/Channel';
import { getFlashModel } from '@/lib/gemini';
import { buildRateLimitKey, checkRateLimit } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';

const SUMMARY_SYSTEM = `You are a technical scribe for a software development team.
Summarize the provided chat messages from a development channel.
Focus on:
- Decisions made and their rationale
- Action items or tasks mentioned
- Unresolved questions or blockers
- Key code or technical references
Be concise and use bullet points. Output plain text (no markdown headers).`;

// POST /api/ai/summarize  { channelId: string, limit?: number }
// Fetches the last N messages from a channel and returns a Gemini-generated summary.
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Rate-limit: 10 summaries / hour per user
        const rl = await checkRateLimit({
            key: buildRateLimitKey('ai_summarize', user._id.toString()),
            limit: 10,
            windowSeconds: 3600,
        });
        if (!rl.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 });
        }

        const { channelId, limit = 100 } = (await req.json()) as {
            channelId?: string;
            limit?: number;
        };

        if (!channelId || !mongoose.isValidObjectId(channelId)) {
            return NextResponse.json({ error: 'Valid channelId is required' }, { status: 400 });
        }

        const channel = await Channel.findById(channelId).lean();
        if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

        await assertWorkspaceMember(user._id.toString(), channel.workspaceId.toString());

        const messages = await Message.find({ channelId, deletedAt: { $exists: false } })
            .sort({ createdAt: -1 })
            .limit(Math.min(Number(limit), 200))
            .populate<{ senderId: { username: string } }>('senderId', 'username')
            .lean();

        if (messages.length === 0) {
            return NextResponse.json({ summary: 'No messages to summarize.' });
        }

        // Build transcript (oldest first)
        const transcript = messages
            .reverse()
            .map((m) => {
                const author = (m.senderId as unknown as { username: string })?.username ?? 'user';
                return `[${author}]: ${m.content}`;
            })
            .join('\n');

        const model = getFlashModel(SUMMARY_SYSTEM);
        const chat = model.startChat({ history: [] });
        const result = await chat.sendMessage(
            `Please summarize the following channel conversation:\n\n${transcript.slice(0, 12000)}`
        );
        const summary = result.response.text();

        return NextResponse.json({ summary, messageCount: messages.length });
    } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('[ai/summarize]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
