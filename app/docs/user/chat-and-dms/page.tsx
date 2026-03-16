'use client';

import DocsFrame from '@/components/docs/DocsFrame';

export default function ChatDmDocsPage() {
    return (
        <DocsFrame
            title="Chat and direct messages"
            description="How to communicate clearly in channels and when to move to direct messages."
            links={[
                { href: '/docs/user', label: 'User docs home' },
                { href: '/docs/user/workspaces-and-channels', label: 'Workspaces' },
                { href: '/docs/user/ai-assistant', label: 'AI assistant' },
            ]}
            toc={[
                { href: '#channel-chat', label: 'Channel chat' },
                { href: '#direct-messages', label: 'Direct messages' },
                { href: '#daily-impact', label: 'Daily impact' },
            ]}
        >
            <div className="grid gap-5 lg:grid-cols-2">
                <article id="channel-chat" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">How to chat in channels</h2>
                    <ol className="mt-4 space-y-3 text-sm leading-7 text-primary list-decimal pl-5">
                        <li>Open a channel from the sidebar.</li>
                        <li>Write your message in the composer and send.</li>
                        <li>Edit or react when context changes.</li>
                        <li>Use threads for replies that should not interrupt the main stream.</li>
                    </ol>
                </article>

                <article id="direct-messages" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">How to use direct messages</h2>
                    <ol className="mt-4 space-y-3 text-sm leading-7 text-primary list-decimal pl-5">
                        <li>Pick a teammate from Members in the sidebar.</li>
                        <li>Open the DM view and start the conversation.</li>
                        <li>Use DM for private or narrow-scoped follow-up.</li>
                        <li>Move key outcomes back to channels when the team needs visibility.</li>
                    </ol>
                </article>

                <article id="daily-impact" className="rounded-[24px] border border-subtle bg-secondary p-6 lg:col-span-2">
                    <h2 className="text-xl font-semibold text-primary">Why this matters for daily work</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Channels preserve collective project knowledge and reduce duplicate questions.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">DM keeps personal coordination fast when channel noise would slow execution.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Combining both creates a balance of transparency and speed for engineering teams.</li>
                    </ul>
                </article>
            </div>
        </DocsFrame>
    );
}