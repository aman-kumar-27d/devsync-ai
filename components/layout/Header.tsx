'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import SearchModal from '@/components/search/SearchModal';

interface Props {
    workspace: { _id: string; name: string } | null;
    channelName?: string;
    onToggleAi: () => void;
    aiOpen: boolean;
    searchOpen?: boolean;
    onSearchOpenChange?: (open: boolean) => void;
}

export default function Header({
    workspace,
    channelName,
    onToggleAi,
    aiOpen,
    searchOpen,
    onSearchOpenChange,
}: Props) {
    const { theme, setTheme } = useTheme();
    const [localSearchOpen, setLocalSearchOpen] = useState(false);
    const isSearchOpen = searchOpen ?? localSearchOpen;

    const setSearchOpen = (open: boolean) => {
        if (onSearchOpenChange) {
            onSearchOpenChange(open);
            return;
        }
        setLocalSearchOpen(open);
    };

    return (
        <>
            <header className="flex h-11 flex-shrink-0 items-center justify-between border-b border-subtle bg-secondary px-4">
                <div className="flex items-center gap-2">
                    {channelName && (
                        <span className="font-semibold text-primary text-sm">{channelName}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="rounded px-2 py-1 text-xs text-muted hover:text-primary hover-bg flex items-center gap-1"
                        title="Search (Ctrl+K)"
                    >
                        <span>⌕</span>
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="hidden sm:inline text-[10px] opacity-50 ml-1">Ctrl K</kbd>
                    </button>

                    <Link
                        href="/docs"
                        className="rounded px-2 py-1 text-xs text-muted hover:text-primary hover-bg flex items-center gap-1"
                        title="Documentation"
                    >
                        <span>?</span>
                        <span className="hidden sm:inline">Docs</span>
                    </Link>

                    {/* Theme toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="rounded p-1.5 text-muted hover:text-primary hover-bg text-sm"
                        title="Toggle theme"
                    >
                        {theme === 'dark' ? '☀' : '☾'}
                    </button>

                    {/* AI toggle */}
                    <button
                        onClick={onToggleAi}
                        className={`rounded px-2 py-1 text-xs hover-bg flex items-center gap-1 ${aiOpen ? 'text-[var(--accent)]' : 'text-muted hover:text-primary'
                            }`}
                        title="AI Assistant (Ctrl+/)"
                    >
                        ✦ AI
                    </button>
                </div>
            </header>
            {isSearchOpen && (
                <SearchModal workspaceId={workspace?._id} onClose={() => setSearchOpen(false)} />
            )}
        </>
    );
}
