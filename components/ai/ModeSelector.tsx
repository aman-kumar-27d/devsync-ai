'use client';

import type { AiMode } from '@/lib/promptEngine';

interface Props {
    current: AiMode;
    onChange: (mode: AiMode) => void;
}

const MODES: { value: AiMode; label: string; icon: string }[] = [
    { value: 'chat', label: 'Chat', icon: '💬' },
    { value: 'codegen', label: 'Generate', icon: '⚡' },
    { value: 'bugfix', label: 'Bug Fix', icon: '🐛' },
    { value: 'explain', label: 'Explain', icon: '🔍' },
    { value: 'docs', label: 'Docs', icon: '📝' },
    { value: 'refactor', label: 'Refactor', icon: '♻️' },
    { value: 'repo', label: 'Repo', icon: '🗂️' },
];

export default function ModeSelector({ current, onChange }: Props) {
    return (
        <div className="flex flex-wrap gap-1">
            {MODES.map((m) => (
                <button
                    key={m.value}
                    onClick={() => onChange(m.value)}
                    className={`rounded px-2 py-1 text-xs transition-colors ${current === m.value
                            ? 'bg-[var(--accent)] text-white'
                            : 'text-muted hover:text-primary hover-bg border border-subtle'
                        }`}
                >
                    {m.icon} {m.label}
                </button>
            ))}
        </div>
    );
}
