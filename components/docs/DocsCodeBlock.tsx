'use client';

import { useState } from 'react';

interface Props {
    title: string;
    code: string;
    label?: string;
}

export default function DocsCodeBlock({ title, code, label }: Props) {
    const [copied, setCopied] = useState(false);

    async function copyCode() {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-subtle bg-[#0b1020] text-slate-100 shadow-[0_18px_40px_rgba(15,17,23,0.28)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-400">{label ?? 'snippet'}</p>
                    <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
                </div>
                <button
                    type="button"
                    onClick={copyCode}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200 transition hover:bg-white/10"
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-6 text-slate-100">
                <code>{code}</code>
            </pre>
        </div>
    );
}