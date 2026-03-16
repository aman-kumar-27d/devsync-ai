'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    messages: { _id: string; content: string; senderId: { username: string } }[];
    snippets: { _id: string; code: string; language: string }[];
    files: { _id: string; originalName: string; url: string; mimetype: string }[];
    users: { _id: string; username: string; email: string; avatarColor: string }[];
}

interface Props {
    workspaceId?: string;
    onClose: () => void;
}

export default function SearchModal({ workspaceId, onClose }: Props) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) { setResults(null); return; }
        setLoading(true);
        try {
            const params = new URLSearchParams({ q, type: 'all' });
            if (workspaceId) params.set('workspaceId', workspaceId);
            const res = await fetch(`/api/search?${params}`);
            const data = await res.json();
            setResults(data.results ?? null);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    useEffect(() => {
        const timer = setTimeout(() => search(query), 400);
        return () => clearTimeout(timer);
    }, [query, search]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-xl border border-subtle bg-secondary shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 border-b border-subtle px-4 py-3">
                    <span className="text-muted">⌕</span>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search messages, snippets, files…"
                        autoFocus
                        className="flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
                    />
                    <kbd className="text-[10px] text-muted">Esc</kbd>
                </div>

                {loading && (
                    <div className="flex justify-center py-6">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                    </div>
                )}

                {results && !loading && (
                    <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border)]">
                        {/* Messages */}
                        {results.messages?.length > 0 && (
                            <section className="px-4 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Messages</p>
                                {results.messages.map((m) => (
                                    <div key={m._id} className="rounded px-2 py-1.5 hover-bg cursor-pointer">
                                        <p className="text-xs font-medium text-primary">{m.senderId?.username}</p>
                                        <p className="text-xs text-muted truncate">{m.content}</p>
                                    </div>
                                ))}
                            </section>
                        )}
                        {/* Snippets */}
                        {results.snippets?.length > 0 && (
                            <section className="px-4 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Snippets</p>
                                {results.snippets.map((s) => (
                                    <div key={s._id} className="rounded px-2 py-1.5 hover-bg cursor-pointer">
                                        <span className="text-[10px] text-[var(--accent)]">{s.language}</span>
                                        <pre className="text-xs text-muted truncate">{s.code.slice(0, 80)}</pre>
                                    </div>
                                ))}
                            </section>
                        )}
                        {/* Files */}
                        {results.files?.length > 0 && (
                            <section className="px-4 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Files</p>
                                {results.files.map((f) => (
                                    <a
                                        key={f._id}
                                        href={f.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded px-2 py-1.5 hover-bg text-xs text-primary"
                                    >
                                        <span>{f.mimetype.startsWith('image/') ? '🖼' : '📎'}</span>
                                        {f.originalName}
                                    </a>
                                ))}
                            </section>
                        )}
                        {results.users?.length > 0 && (
                            <section className="px-4 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Users</p>
                                {results.users.map((u) => (
                                    <div
                                        key={u._id}
                                        className="rounded px-2 py-1.5 hover-bg cursor-pointer"
                                        onClick={() => {
                                            if (workspaceId) {
                                                router.push(`/workspace/${workspaceId}/dm/${u._id}`);
                                            }
                                            onClose();
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                                                style={{ backgroundColor: u.avatarColor }}
                                            >
                                                {u.username[0]?.toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-primary truncate">{u.username}</p>
                                                <p className="text-[10px] text-muted truncate">{u.email} · {u._id}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                        {results.messages?.length === 0 && results.snippets?.length === 0 && results.files?.length === 0 && results.users?.length === 0 && (
                            <p className="py-6 text-center text-xs text-muted">No results found</p>
                        )}
                    </div>
                )}

                {!results && !loading && query.length > 0 && (
                    <p className="py-6 text-center text-xs text-muted">Type at least 2 characters</p>
                )}

                {!query && (
                    <p className="py-6 text-center text-xs text-muted">Start typing to search</p>
                )}
            </div>
        </div>
    );
}
