'use client';

import DocsFrame from '@/components/docs/DocsFrame';
import DocsCodeBlock from '@/components/docs/DocsCodeBlock';

export default function IntegrationSecretsDocsPage() {
    return (
        <DocsFrame
            title="Integration secrets: GITHUB_TOKEN and WEBHOOK_SECRET"
            description="Purpose, setup guidance, and operational impact of optional integration secrets."
            links={[
                { href: '/docs/open-source', label: 'Open source home' },
                { href: '/docs/open-source/local-setup', label: 'Local setup' },
                { href: '/docs/open-source/mongodb-setup', label: 'MongoDB setup' },
                { href: '/docs/open-source/redis-setup', label: 'Redis setup' },
            ]}
            toc={[
                { href: '#why-secrets', label: 'Why these secrets exist' },
                { href: '#github-token', label: 'GITHUB_TOKEN' },
                { href: '#webhook-secret', label: 'WEBHOOK_SECRET' },
                { href: '#setup-snippet', label: 'Setup snippet' },
            ]}
        >
            <div className="space-y-5">
                <article id="why-secrets" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Why these secrets are used</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        Both values are optional but recommended when you enable external integrations. They protect integration endpoints and improve reliability when the app talks to third-party APIs.
                    </p>
                </article>

                <article id="github-token" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">GITHUB_TOKEN purpose</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        The GitHub token is used for the unfurl integration to fetch richer GitHub metadata with higher rate limits than anonymous requests. Without it, the feature can still work but may hit lower public API limits.
                    </p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Use a personal access token with the minimum scopes required for metadata reads.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Never expose the token in client code or commit it to version control.</li>
                    </ul>
                </article>

                <article id="webhook-secret" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">WEBHOOK_SECRET purpose</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        The webhook secret validates inbound requests to webhook endpoints so only trusted CI/CD systems or integrations can post events. This prevents unauthorized event injection.
                    </p>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Configure the same secret value in both the sender and this app environment.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Rotate the secret if it is ever exposed in logs or screenshots.</li>
                    </ul>
                </article>

                <div id="setup-snippet">
                    <DocsCodeBlock
                        title=".env.local integration values"
                        label=".env.local"
                        code={`# Optional: GitHub personal access token for higher API rate limits\nGITHUB_TOKEN=\n# Optional: Secret used to verify webhook payload source\nWEBHOOK_SECRET=`}
                    />
                </div>
            </div>
        </DocsFrame>
    );
}