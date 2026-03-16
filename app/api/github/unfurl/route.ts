import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Matches: https://github.com/owner/repo/pull/123  or  /issues/456
const PR_RE = /https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/(pull|issues?)\/(\d+)/gi;
// Matches: https://github.com/owner/repo  (no sub-path)
const REPO_RE = /https:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\s|$)/gi;

interface UnfurlResult {
    url: string;
    type: 'pull' | 'issue' | 'repo';
    title?: string;
    state?: string;
    number?: number;
    repo?: string;
    description?: string;
}

async function fetchGitHub(path: string): Promise<Record<string, unknown> | null> {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`https://api.github.com/${path}`, {
            headers,
            // 5 second timeout via AbortSignal
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        return res.json() as Promise<Record<string, unknown>>;
    } catch {
        return null;
    }
}

// POST /api/github/unfurl  { content: string }
// Returns an array of unfurl cards for any GitHub URLs found in content.
export async function POST(req: NextRequest) {
    try {
        const { user, error } = await requireAuthUser(req);
        if (error || !user) return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { content } = (await req.json()) as { content?: string };
        if (!content || typeof content !== 'string') {
            return NextResponse.json({ unfurls: [] });
        }

        const results: UnfurlResult[] = [];
        const seen = new Set<string>();

        // PR / Issue matches
        let m: RegExpExecArray | null;
        PR_RE.lastIndex = 0;
        while ((m = PR_RE.exec(content)) !== null) {
            const url = m[0];
            if (seen.has(url)) continue;
            seen.add(url);
            const [, owner, repo, type, num] = m;
            const apiPath = type.startsWith('pull')
                ? `repos/${owner}/${repo}/pulls/${num}`
                : `repos/${owner}/${repo}/issues/${num}`;
            const data = await fetchGitHub(apiPath);
            if (data) {
                results.push({
                    url,
                    type: type.startsWith('pull') ? 'pull' : 'issue',
                    number: Number(num),
                    title: String(data.title ?? ''),
                    state: String(data.state ?? ''),
                    repo: `${owner}/${repo}`,
                });
            } else {
                results.push({ url, type: type.startsWith('pull') ? 'pull' : 'issue', number: Number(num), repo: `${owner}/${repo}` });
            }
        }

        // Repo matches (only if not already captured above)
        REPO_RE.lastIndex = 0;
        while ((m = REPO_RE.exec(content)) !== null) {
            const url = `https://github.com/${m[1]}/${m[2]}`;
            if (seen.has(url)) continue;
            seen.add(url);
            const data = await fetchGitHub(`repos/${m[1]}/${m[2]}`);
            if (data) {
                results.push({
                    url,
                    type: 'repo',
                    title: String(data.full_name ?? `${m[1]}/${m[2]}`),
                    description: String(data.description ?? ''),
                    repo: `${m[1]}/${m[2]}`,
                });
            }
        }

        return NextResponse.json({ unfurls: results });
    } catch (err) {
        console.error('[github/unfurl]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
