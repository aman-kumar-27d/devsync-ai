'use client';

import Link from 'next/link';
import DocsFrame from '@/components/docs/DocsFrame';

const featureCards = [
    {
        title: 'Workspaces and channels',
        why: 'Keeps each team organized by project context and avoids mixing unrelated conversations.',
        how: 'Create or join a workspace, open channels from the sidebar, and create new channels with the plus button.',
        useCase: 'Daily planning, standup updates, release coordination, and issue triage discussions.',
        href: '/docs/user/workspaces-and-channels',
    },
    {
        title: 'Chat and direct messages',
        why: 'Supports both public knowledge sharing and private one-to-one problem solving.',
        how: 'Post in channels for team visibility and open member DMs for direct conversations.',
        useCase: 'Clarify decisions in public channels, then use DM for focused follow-up when needed.',
        href: '/docs/user/chat-and-dms',
    },
    {
        title: 'AI assistant workflows',
        why: 'Reduces context switching by bringing coding help into the same place where your team communicates.',
        how: 'Open the AI panel, choose a mode, paste context, and iterate on generated or reviewed code.',
        useCase: 'Generate snippets, explain legacy code, debug failures, and draft docs during active discussions.',
        href: '/docs/user/ai-assistant',
    },
    {
        title: 'Snippets, files, search, notifications',
        why: 'Makes shared knowledge discoverable and actionable beyond a single message thread.',
        how: 'Save snippets, upload files, search globally, and monitor mention notifications.',
        useCase: 'Store reusable code, attach logs/screenshots, and quickly recover context after interruptions.',
        href: '/docs#user-guide',
    },
];

export default function UserDocsPage() {
    return (
        <DocsFrame
            title="User guide and feature playbook"
            description="Detailed feature guidance for daily team workflows inside DevCollab AI."
            links={[
                { href: '/docs/user/workspaces-and-channels', label: 'Workspaces' },
                { href: '/docs/user/chat-and-dms', label: 'Chat and DMs' },
                { href: '/docs/user/ai-assistant', label: 'AI assistant' },
                { href: '/docs/open-source', label: 'Open source docs' },
            ]}
            toc={[
                { href: '#feature-cards', label: 'Feature cards' },
            ]}
        >
            <div className="grid gap-5 lg:grid-cols-2" id="feature-cards">
                {featureCards.map((card) => (
                    <article key={card.title} className="rounded-[26px] border border-subtle bg-secondary p-6 shadow-[0_14px_48px_rgba(15,17,23,0.08)]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Feature</p>
                        <h2 className="mt-2 text-2xl font-semibold text-primary">{card.title}</h2>
                        <div className="mt-4 space-y-3 text-sm leading-7 text-primary">
                            <p><span className="font-semibold">Why it is there:</span> {card.why}</p>
                            <p><span className="font-semibold">How to use:</span> {card.how}</p>
                            <p><span className="font-semibold">Daily value:</span> {card.useCase}</p>
                        </div>
                        <div className="mt-5">
                            <Link
                                href={card.href}
                                className="inline-flex rounded-full border border-subtle bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                                Read details
                            </Link>
                        </div>
                    </article>
                ))}
            </div>
        </DocsFrame>
    );
}