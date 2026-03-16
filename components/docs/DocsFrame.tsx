'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DocsToc from '@/components/docs/DocsToc';

interface DocsLink {
    href: string;
    label: string;
}

interface Props {
    title: string;
    description: string;
    links?: DocsLink[];
    toc?: DocsLink[];
    children: ReactNode;
}

export default function DocsFrame({ title, description, links = [], toc = [], children }: Props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [loading, router, user]);

    if (loading || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-primary">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                    <p className="mt-4 text-xs text-muted">Preparing documentation...</p>
                </div>
            </div>
        );
    }

    const workspaceHref = user.workspaces?.[0] ? `/workspace/${user.workspaces[0]}` : '/';

    return (
        <main className="h-screen overflow-y-auto bg-primary">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <header className="sticky top-0 z-20 rounded-2xl border border-subtle bg-secondary/95 px-4 py-4 backdrop-blur sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">DevCollab Docs</p>
                            <h1 className="mt-1 text-xl font-semibold text-primary sm:text-2xl">{title}</h1>
                            <p className="mt-1 text-sm text-muted">{description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/docs"
                                className="rounded-full border border-subtle bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                                Docs home
                            </Link>
                            <Link
                                href={workspaceHref}
                                className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[var(--accent-hover)]"
                            >
                                Workspace
                            </Link>
                        </div>
                    </div>
                    {links.length > 0 && (
                        <nav className="mt-4 flex flex-wrap gap-2">
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-full border border-subtle bg-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    )}
                </header>

                <div className="pb-8 pt-6 xl:flex xl:items-start xl:gap-6">
                    <DocsToc items={toc} />
                    <div className="min-w-0 flex-1">{children}</div>
                </div>
            </div>
        </main>
    );
}