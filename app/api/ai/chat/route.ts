import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { AiSession } from '@/models/AiSession';
import { getFlashModel, getProModel } from '@/lib/gemini';
import { buildSystemPrompt, buildUserMessage, AiMode } from '@/lib/promptEngine';

// Simple in-memory rate limiter: max 30 requests per user per minute.
// Includes periodic pruning so stale entries do not accumulate indefinitely.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_PRUNE_INTERVAL_MS = 5 * 60_000;
let lastRateLimitPruneAt = 0;

function pruneRateLimitMap(now: number) {
    if (now - lastRateLimitPruneAt < RATE_LIMIT_PRUNE_INTERVAL_MS) {
        return;
    }

    rateLimitMap.forEach((entry, userId) => {
        if (now > entry.resetAt) {
            rateLimitMap.delete(userId);
        }
    });

    lastRateLimitPruneAt = now;
}

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    pruneRateLimitMap(now);

    const entry = rateLimitMap.get(userId);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) return false;
    entry.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!checkRateLimit(user._id.toString())) {
            return NextResponse.json({ error: 'Rate limit exceeded. Try again in a moment.' }, { status: 429 });
        }

        const body = await req.json();
        const { message, mode = 'chat', useProModel = false, workspaceId } = body as {
            message: string;
            mode: AiMode;
            useProModel: boolean;
            workspaceId?: string;
        };

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Load / create session
        let session = await AiSession.findOne({ userId: user._id, mode });
        if (!session) {
            session = new AiSession({ userId: user._id, mode, history: [], workspaceId });
        }

        const systemInstruction = buildSystemPrompt(mode);
        const userText = buildUserMessage(mode, message.slice(0, 8000));

        const model = useProModel ? getProModel(systemInstruction) : getFlashModel(systemInstruction);
        const chat = model.startChat({
            history: session.history.slice(-20), // last 20 turns
        });

        // Streaming response
        const result = await chat.sendMessageStream(userText);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let fullText = '';
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        fullText += text;
                        controller.enqueue(encoder.encode(text));
                    }
                } finally {
                    // Persist to history (trim to last 20 turns)
                    session!.history.push({ role: 'user', parts: [{ text: userText }] });
                    session!.history.push({ role: 'model', parts: [{ text: fullText }] });
                    if (session!.history.length > 40) session!.history = session!.history.slice(-40);
                    await session!.save();
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (err) {
        console.error('[ai/chat POST]', err);
        return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }
}

// DELETE /api/ai/chat  — clear session history for a mode
export async function DELETE(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const mode = searchParams.get('mode') as AiMode | null;

        if (mode) {
            await AiSession.findOneAndUpdate({ userId: user._id, mode }, { history: [] });
        } else {
            await AiSession.updateMany({ userId: user._id }, { history: [] });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[ai/chat DELETE]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
