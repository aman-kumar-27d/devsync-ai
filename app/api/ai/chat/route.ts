import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { AiSession } from '@/models/AiSession';
import { getFlashModel, getProModel } from '@/lib/gemini';
import { buildSystemPrompt, buildUserMessage, AiMode } from '@/lib/promptEngine';
import { buildRateLimitKey, checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rateLimit = await checkRateLimit({
            key: buildRateLimitKey('ai_chat_user', user._id.toString()),
            limit: 30,
            windowSeconds: 60,
        });

        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Rate limit exceeded. Try again in a moment.' }, { status: 429 });
        }

        const body = await req.json();
        const { message, mode = 'chat', useProModel = false, workspaceId, repoContext } = body as {
            message: string;
            mode: AiMode;
            useProModel: boolean;
            workspaceId?: string;
            repoContext?: string; // optional workspace snippets/messages context for repo mode
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
        const userText = buildUserMessage(mode, message.slice(0, 8000), repoContext?.slice(0, 4000));

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
