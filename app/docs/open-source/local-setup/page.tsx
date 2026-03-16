'use client';

import DocsFrame from '@/components/docs/DocsFrame';
import DocsCodeBlock from '@/components/docs/DocsCodeBlock';
import { repoUrl } from '@/components/docs/docsContent';

export default function LocalSetupDocsPage() {
    return (
        <DocsFrame
            title="Local setup end-to-end"
            description="Step-by-step setup for contributors running the code locally."
            links={[
                { href: '/docs/open-source', label: 'Open source home' },
                { href: '/docs/open-source/mongodb-setup', label: 'MongoDB setup' },
                { href: '/docs/open-source/redis-setup', label: 'Redis setup' },
                { href: '/docs/open-source/integration-secrets', label: 'Integration secrets' },
            ]}
            toc={[
                { href: '#prerequisites', label: 'Prerequisites' },
                { href: '#clone-install', label: 'Clone and install' },
                { href: '#env-setup', label: 'Environment setup' },
                { href: '#run-app', label: 'Run app' },
            ]}
        >
            <div className="space-y-5">
                <article id="prerequisites" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Prerequisites</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Node.js 18+ and npm.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">MongoDB connection string (Atlas or local MongoDB).</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Gemini API key for AI endpoints.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Optional Redis URL for distributed rate limiting.</li>
                    </ul>
                </article>

                <div id="clone-install">
                    <DocsCodeBlock
                        title="Clone and install"
                        label="terminal"
                        code={`git clone ${repoUrl}\ncd devsync-ai\nnpm install`}
                    />
                </div>

                <div id="env-setup">
                    <DocsCodeBlock
                        title="Create .env.local"
                        label="env"
                        code={`MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devsync-ai\nGEMINI_API_KEY=your_gemini_api_key_here\nJWT_SECRET=a_long_random_secret_string_here\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n# Optional integration and rate-limit settings\nGITHUB_TOKEN=\nWEBHOOK_SECRET=\nREDIS_URL=redis://localhost:6379`}
                    />
                </div>

                <div id="run-app">
                    <DocsCodeBlock
                        title="Run development and production"
                        label="scripts"
                        code={`npm run dev\n\n# Build for production\nnpm run build\nnpm start`}
                    />
                </div>
            </div>
        </DocsFrame>
    );
}