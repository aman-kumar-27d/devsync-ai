'use client';

import { useState, useRef, useEffect } from 'react';
import type { AiMode } from '@/lib/promptEngine';
import ModeSelector from './ModeSelector';
import toast from 'react-hot-toast';

// Markdown is rendered via the custom MarkdownContent component below

interface ChatEntry {
    role: 'user' | 'assistant';
    content: string;
}

interface Props {
    onClose: () => void;
    initialSnippet?: string;
    workspaceId?: string;
}

const MODE_LABELS: Record<AiMode, string> = {
    chat: 'General Chat',
    codegen: 'Code Gen',
    bugfix: 'Bug Fix',
    explain: 'Explain',
    docs: 'Docs',
    refactor: 'Refactor',
    repo: 'Repo Context',
};

export default function AiPanel({ onClose, initialSnippet, workspaceId }: Props) {
    const [mode, setMode] = useState<AiMode>('chat');
    const [input, setInput] = useState(initialSnippet ?? '');
    const [history, setHistory] = useState<ChatEntry[]>([]);
    const [streaming, setStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');
    const [repoContext, setRepoContext] = useState<string | undefined>();
    const bottomRef = useRef<HTMLDivElement>(null);

    // When entering repo mode, fetch recent snippets as context
    useEffect(() => {
        if (mode !== 'repo' || !workspaceId) return;
        fetch(`/api/snippets?workspaceId=${workspaceId}&limit=10`)
            .then((r) => r.json())
            .then((d) => {
                const snippets: { language: string; code: string; aiExplanation?: string }[] = d.snippets ?? [];
                if (snippets.length === 0) return;
                const ctx = snippets
                    .map((s, i) => `[Snippet ${i + 1}] (${s.language})\n${s.code}`)
                    .join('\n\n');
                setRepoContext(ctx);
            })
            .catch(() => { /* fail silently — repo mode still works without context */ });
    }, [mode, workspaceId]);

    useEffect(() => {
        if (initialSnippet) {
            setMode('explain');
            setInput(initialSnippet);
        }
    }, [initialSnippet]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, streamingText]);

    async function sendMessage() {
        const trimmed = input.trim();
        if (!trimmed || streaming) return;
        setInput('');
        const userEntry: ChatEntry = { role: 'user', content: trimmed };
        setHistory((h) => [...h, userEntry]);
        setStreaming(true);
        setStreamingText('');

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: trimmed,
                    mode,
                    workspaceId,
                    repoContext: mode === 'repo' ? repoContext : undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error ?? 'AI error');
                setStreaming(false);
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let full = '';
            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    full += chunk;
                    setStreamingText(full);
                }
            }
            setHistory((h) => [...h, { role: 'assistant', content: full }]);
            setStreamingText('');
        } catch {
            toast.error('Failed to reach AI. Check your API key.');
        } finally {
            setStreaming(false);
        }
    }

    async function clearHistory() {
        await fetch(`/api/ai/chat?mode=${mode}`, { method: 'DELETE' });
        setHistory([]);
        setStreamingText('');
        toast.success('Conversation cleared');
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        toast.success('Copied!');
    }

    return (
        <aside className="flex w-80 flex-shrink-0 flex-col border-l border-subtle bg-secondary">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
                <span className="text-sm font-semibold text-[var(--accent)]">✦ AI Assistant</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearHistory}
                        className="rounded p-1 text-xs text-muted hover:text-primary hover-bg"
                        title="Clear conversation"
                    >
                        ↺
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded p-1 text-xs text-muted hover:text-primary hover-bg"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Mode selector */}
            <div className="border-b border-subtle px-3 py-2">
                <ModeSelector current={mode} onChange={setMode} />
            </div>

            {/* Chat history */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
                {history.length === 0 && !streamingText && (
                    <div className="mt-8 text-center text-xs text-muted">
                        <p className="text-2xl mb-2">✦</p>
                        <p>Mode: <strong className="text-primary">{MODE_LABELS[mode]}</strong></p>
                        <p className="mt-1 opacity-70">Ask anything or paste code to get started</p>
                    </div>
                )}
                {history.map((entry, i) => (
                    <div key={i} className={`flex flex-col gap-1 ${entry.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-muted">{entry.role === 'user' ? 'You' : '✦ Gemini'}</span>
                        <div
                            className={`relative max-w-full rounded-lg px-3 py-2 text-xs ${entry.role === 'user'
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'bg-primary text-primary border border-subtle'
                                }`}
                        >
                            <MarkdownContent content={entry.content} />
                            {entry.role === 'assistant' && (
                                <button
                                    onClick={() => copyToClipboard(entry.content)}
                                    className="absolute right-1 top-1 rounded p-0.5 text-[10px] text-muted hover:text-primary opacity-50 hover:opacity-100"
                                    title="Copy"
                                >
                                    ⎘
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {streamingText && (
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-[10px] text-muted">✦ Gemini</span>
                        <div className="max-w-full rounded-lg border border-subtle bg-primary px-3 py-2 text-xs text-primary">
                            <MarkdownContent content={streamingText} />
                            <span className="animate-pulse ml-0.5">▌</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-subtle px-3 py-2">
                <div className="rounded border border-subtle bg-primary px-3 py-2 focus-within:border-[var(--accent)]">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder={`Ask ${MODE_LABELS[mode]}… (Enter to send)`}
                        disabled={streaming}
                        rows={3}
                        className="w-full resize-none bg-transparent text-xs text-primary outline-none placeholder:text-muted"
                    />
                    <div className="flex justify-end mt-1">
                        <button
                            onClick={sendMessage}
                            disabled={streaming || !input.trim()}
                            className="rounded bg-[var(--accent)] px-3 py-1 text-xs text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {streaming ? '…' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// Simple markdown renderer — code blocks get copy button
function MarkdownContent({ content }: { content: string }) {
    // Parse code blocks manually for copy support
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
        <div className="space-y-1">
            {parts.map((part, i) => {
                if (part.startsWith('```')) {
                    const lines = part.slice(3, -3).split('\n');
                    const lang = lines[0] ?? '';
                    const code = lines.slice(1).join('\n');
                    return (
                        <div key={i} className="relative rounded bg-[var(--bg)] border border-subtle">
                            {lang && <span className="px-2 pt-1 text-[10px] text-muted block">{lang}</span>}
                            <pre className="overflow-x-auto px-3 pb-2 pt-1 text-[11px] leading-relaxed text-primary">
                                <code>{code}</code>
                            </pre>
                            <button
                                onClick={() => navigator.clipboard.writeText(code)}
                                className="absolute right-1 top-1 rounded p-0.5 text-[10px] text-muted hover:text-primary opacity-60 hover:opacity-100"
                                title="Copy code"
                            >
                                ⎘
                            </button>
                        </div>
                    );
                }
                return <p key={i} className="whitespace-pre-wrap break-words">{part}</p>;
            })}
        </div>
    );
}
