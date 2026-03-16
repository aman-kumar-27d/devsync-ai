'use client';

import DocsFrame from '@/components/docs/DocsFrame';
import DocsCodeBlock from '@/components/docs/DocsCodeBlock';

export default function MongoSetupDocsPage() {
    return (
        <DocsFrame
            title="MongoDB setup and project wiring"
            description="Create a database, generate credentials, and connect the app through MONGODB_URI."
            links={[
                { href: '/docs/open-source', label: 'Open source home' },
                { href: '/docs/open-source/local-setup', label: 'Local setup' },
                { href: '/docs/open-source/redis-setup', label: 'Redis setup' },
                { href: '/docs/open-source/integration-secrets', label: 'Integration secrets' },
            ]}
            toc={[
                { href: '#why-mongodb', label: 'Why MongoDB' },
                { href: '#create-database', label: 'Create database' },
                { href: '#set-uri', label: 'Set URI' },
                { href: '#verify-mongodb', label: 'Verify setup' },
            ]}
        >
            <div className="space-y-5">
                <article id="why-mongodb" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Why MongoDB is needed</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        DevCollab AI stores users, workspaces, channels, messages, files, snippets, and notifications in MongoDB through Mongoose models. Without MONGODB_URI, the app cannot load authenticated workspace data.
                    </p>
                </article>

                <article id="create-database" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Create a database (Atlas example)</h2>
                    <ol className="mt-4 space-y-3 text-sm leading-7 text-primary list-decimal pl-5">
                        <li>Create an Atlas project and cluster.</li>
                        <li>Create a database user with read/write permissions.</li>
                        <li>Allow your local IP or temporary 0.0.0.0/0 while testing.</li>
                        <li>Copy the cluster connection string and replace username/password.</li>
                    </ol>
                </article>

                <div id="set-uri">
                    <DocsCodeBlock
                        title="Set MongoDB URI"
                        label=".env.local"
                        code={'MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devsync-ai'}
                    />
                </div>

                <article id="verify-mongodb" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Local verification</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Run npm run dev and register/login once.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Create a workspace and send a message.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Confirm collections are populated in your MongoDB instance.</li>
                    </ul>
                </article>
            </div>
        </DocsFrame>
    );
}