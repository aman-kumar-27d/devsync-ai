'use client';

import Link from 'next/link';
import DocsFrame from '@/components/docs/DocsFrame';
import { repoUrl } from '@/components/docs/docsContent';

const setupPages = [
    {
        title: 'Local setup guide',
        description: 'Complete setup flow from clone to running the app on localhost.',
        href: '/docs/open-source/local-setup',
    },
    {
        title: 'MongoDB setup guide',
        description: 'Create a database, generate a connection string, and wire it to MONGODB_URI.',
        href: '/docs/open-source/mongodb-setup',
    },
    {
        title: 'Redis setup guide',
        description: 'Understand why Redis is used and how to configure REDIS_URL for rate limiting.',
        href: '/docs/open-source/redis-setup',
    },
    {
        title: 'Integration secrets guide',
        description: 'Learn why GITHUB_TOKEN and WEBHOOK_SECRET are used and when to configure them.',
        href: '/docs/open-source/integration-secrets',
    },
];

export default function OpenSourceDocsPage() {
    return (
        <DocsFrame
            title="Open-source and local development docs"
            description="Contributor-focused documentation for setup, architecture intent, and production-minded local configuration."
            links={[
                { href: '/docs/open-source/local-setup', label: 'Local setup' },
                { href: '/docs/open-source/mongodb-setup', label: 'MongoDB setup' },
                { href: '/docs/open-source/redis-setup', label: 'Redis setup' },
                { href: '/docs/open-source/integration-secrets', label: 'Integration secrets' },
                { href: '/docs/user', label: 'User docs' },
            ]}
            toc={[
                { href: '#open-source-intro', label: 'Introduction' },
                { href: '#setup-pages', label: 'Setup pages' },
            ]}
        >
            <div className="space-y-5">
                <article id="open-source-intro" className="rounded-[26px] border border-subtle bg-secondary p-6 shadow-[0_14px_48px_rgba(15,17,23,0.08)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Introduction</p>
                    <h2 className="mt-2 text-2xl font-semibold text-primary">Why this section exists</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        This section helps contributors understand how to run and maintain DevCollab AI as open source. It covers setup prerequisites, environment strategy, data dependencies, and infrastructure notes used by the current codebase.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        Repository URL: <a className="text-[var(--accent)] hover:underline" href={repoUrl} target="_blank" rel="noreferrer">{repoUrl}</a>
                    </p>
                </article>

                <div id="setup-pages" className="grid gap-5 lg:grid-cols-2">
                    {setupPages.map((page) => (
                        <article key={page.href} className="rounded-[24px] border border-subtle bg-secondary p-5">
                            <h3 className="text-lg font-semibold text-primary">{page.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-muted">{page.description}</p>
                            <div className="mt-4">
                                <Link
                                    href={page.href}
                                    className="inline-flex rounded-full border border-subtle bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                >
                                    Open page
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </DocsFrame>
    );
}