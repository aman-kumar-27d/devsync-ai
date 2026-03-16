import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuthUser } from '@/lib/auth';
import { Snippet } from '@/models/Snippet';
import { getFlashModel } from '@/lib/gemini';
import { assertWorkspaceMember } from '@/lib/guards';

export const dynamic = 'force-dynamic';

// GET /api/snippets?workspaceId=<id>&limit=<n>
// Returns recent snippets for a workspace (for repo AI context).
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get('workspaceId');
        const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50);

        if (!workspaceId) {
            return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
        }

        await assertWorkspaceMember(user._id.toString(), workspaceId);

        const snippets = await Snippet.find({ workspaceId })
            .sort({ _id: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json({ snippets });
    } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (status === 404) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        console.error('[snippets GET]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { messageId, workspaceId, code, language = 'plaintext', explain = false } = await req.json();
        if (!code || !messageId || !workspaceId) {
            return NextResponse.json({ error: 'code, messageId, and workspaceId are required' }, { status: 400 });
        }

        await assertWorkspaceMember(user._id.toString(), workspaceId);

        let aiExplanation: string | undefined;
        if (explain) {
            try {
                const model = getFlashModel();
                const result = await model.generateContent(
                    `Explain the following ${language} code clearly and concisely:\n\n\`\`\`${language}\n${code.slice(0, 4000)}\n\`\`\``
                );
                aiExplanation = result.response.text();
            } catch {
                // Non-fatal: proceed without explanation
            }
        }

        const snippetPayload = {
            messageId,
            workspaceId,
            code: code.slice(0, 50000),
            language,
            aiExplanation,
        };

        let snippet;
        try {
            snippet = await Snippet.create(snippetPayload);
        } catch (error) {
            // Existing databases may have an old text index that treats `language`
            // as Mongo's language override field, which breaks values like "ts".
            const maybeMongoErr = error as { code?: number };
            if (maybeMongoErr.code !== 17262) throw error;

            await Snippet.collection.dropIndex('code_text').catch(() => null);
            await Snippet.collection.createIndex(
                { code: 'text' },
                { name: 'code_text', language_override: 'mongoLanguageOverride' }
            );
            snippet = await Snippet.create(snippetPayload);
        }

        return NextResponse.json({ snippet }, { status: 201 });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 404) {
            return NextResponse.json({ error: (err as Error).message }, { status });
        }
        console.error('[snippets POST]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
