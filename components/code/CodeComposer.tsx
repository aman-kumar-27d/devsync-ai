'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
    'typescript', 'javascript', 'python', 'java', 'go', 'rust', 'cpp', 'c',
    'csharp', 'html', 'css', 'json', 'yaml', 'bash', 'sql', 'plaintext',
];

interface Props {
    onClose: () => void;
    channelId?: string;
    workspaceId?: string;
    threadId?: string;
}

export default function CodeComposer({ onClose, channelId, workspaceId, threadId }: Props) {
    const [code, setCode] = useState('// Write your code here\n');
    const [language, setLanguage] = useState('typescript');
    const [sending, setSending] = useState(false);

    async function sendSnippet() {
        if (!code.trim() || !channelId) { toast.error('No channel selected'); return; }
        setSending(true);
        try {
            // Post as a message with type=code
            const msgRes = await fetch(`/api/channels/${channelId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: `\`\`\`${language}\n${code}\n\`\`\``,
                    type: 'code',
                    ...(threadId ? { threadId } : {}),
                }),
            });
            if (!msgRes.ok) throw new Error('message failed');
            const { message } = await msgRes.json();

            // Store snippet separately for search
            if (workspaceId) {
                await fetch('/api/snippets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageId: message._id, workspaceId, code, language }),
                });
            }

            toast.success('Snippet sent!');
            onClose();
        } catch {
            toast.error('Failed to send snippet');
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="mb-2 rounded border border-subtle bg-secondary overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-subtle px-3 py-1.5">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded border border-subtle bg-primary px-2 py-0.5 text-xs text-primary outline-none focus:border-[var(--accent)]"
                >
                    {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                    ))}
                </select>
                <div className="flex items-center gap-1">
                    <button
                        onClick={sendSnippet}
                        disabled={sending}
                        className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs text-white hover:bg-[var(--accent-hover)] disabled:opacity-40"
                    >
                        {sending ? '…' : 'Send Snippet'}
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded px-2 py-0.5 text-xs text-muted hover-bg hover:text-primary"
                    >
                        Cancel
                    </button>
                </div>
            </div>
            {/* Monaco */}
            <MonacoEditor
                height="200px"
                language={language}
                value={code}
                onChange={(v) => setCode(v ?? '')}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 2,
                }}
            />
        </div>
    );
}
