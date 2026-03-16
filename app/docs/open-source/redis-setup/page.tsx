'use client';

import DocsFrame from '@/components/docs/DocsFrame';
import DocsCodeBlock from '@/components/docs/DocsCodeBlock';

export default function RedisSetupDocsPage() {
    return (
        <DocsFrame
            title="Redis setup and usage"
            description="Why Redis is used in this project and how to configure REDIS_URL."
            links={[
                { href: '/docs/open-source', label: 'Open source home' },
                { href: '/docs/open-source/local-setup', label: 'Local setup' },
                { href: '/docs/open-source/mongodb-setup', label: 'MongoDB setup' },
                { href: '/docs/open-source/integration-secrets', label: 'Integration secrets' },
            ]}
            toc={[
                { href: '#why-redis', label: 'Why Redis' },
                { href: '#setup-redis', label: 'Setup local Redis' },
                { href: '#docker-redis', label: 'Docker command' },
                { href: '#set-redis-url', label: 'Set REDIS_URL' },
                { href: '#verify-redis', label: 'Verify setup' },
            ]}
        >
            <div className="space-y-5">
                <article id="why-redis" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Why Redis is in the project</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        Redis is used by the rate limiter backend for consistent request throttling across instances. If Redis is unavailable, the code falls back to an in-memory limiter, which is useful for local development but less consistent in distributed deployments.
                    </p>
                </article>

                <article id="setup-redis" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Set up Redis locally</h2>
                    <ol className="mt-4 space-y-3 text-sm leading-7 text-primary list-decimal pl-5">
                        <li>Install Redis locally or run it in Docker.</li>
                        <li>Start Redis on port 6379.</li>
                        <li>Add REDIS_URL in .env.local.</li>
                        <li>Restart the dev server.</li>
                    </ol>
                </article>

                <div id="docker-redis">
                    <DocsCodeBlock
                        title="Run Redis with Docker"
                        label="docker"
                        code={'docker run --name devcollab-redis -p 6379:6379 -d redis:7'}
                    />
                </div>

                <div id="set-redis-url">
                    <DocsCodeBlock
                        title="Configure REDIS_URL"
                        label=".env.local"
                        code={'REDIS_URL=redis://localhost:6379'}
                    />
                </div>

                <article id="verify-redis" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">How to confirm it is working</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Start the app and exercise endpoints that are rate-limited.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">If Redis is misconfigured, the app logs a warning and uses fallback mode.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">In production, use a managed Redis service for stable multi-instance rate limiting.</li>
                    </ul>
                </article>
            </div>
        </DocsFrame>
    );
}