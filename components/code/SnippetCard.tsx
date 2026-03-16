'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface Props {
    content: string;
    language?: string;
    onExplain?: (code: string) => void;
}

export default function SnippetCard({ content, language = 'plaintext', onExplain }: Props) {
    const [expanded, setExpanded] = useState(false);

    // Parse out language and code if content looks like a fenced block
    let lang = language;
    let code = content;
    if (content.startsWith('```')) {
        const lines = content.replace(/^```/, '').replace(/```$/, '').split('\n');
        if (lines.length > 1) {
            lang = lines[0] || language;
            code = lines.slice(1).join('\n');
        }
    }

    const preview = code.split('\n').slice(0, 8).join('\n');
    const isLong = code.split('\n').length > 8;

    return (
        <div className="my-1 rounded border border-subtle bg-[var(--bg)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-secondary border-b border-subtle">
                <span className="text-[11px] font-mono text-muted">{lang}</span>
                <div className="flex items-center gap-1">
                    {onExplain && (
                        <button
                            onClick={() => onExplain(code)}
                            className="rounded px-1.5 py-0.5 text-[10px] text-muted hover:text-[var(--accent)] hover-bg"
                            title="Ask AI to explain"
                        >
                            ✦ Explain
                        </button>
                    )}
                    <button
                        onClick={() => { navigator.clipboard.writeText(code); toast.success('Copied!'); }}
                        className="rounded px-1.5 py-0.5 text-[10px] text-muted hover:text-primary hover-bg"
                        title="Copy code"
                    >
                        ⎘ Copy
                    </button>
                </div>
            </div>
            {/* Code */}
            <pre className="overflow-x-auto px-3 py-2 text-[11px] leading-relaxed text-primary font-mono">
                <code>{expanded ? code : preview}</code>
            </pre>
            {isLong && (
                <button
                    onClick={() => setExpanded((p) => !p)}
                    className="w-full border-t border-subtle py-1 text-[10px] text-muted hover:text-primary hover-bg text-center"
                >
                    {expanded ? 'Show less ▲' : `Show ${code.split('\n').length - 8} more lines ▼`}
                </button>
            )}
        </div>
    );
}
