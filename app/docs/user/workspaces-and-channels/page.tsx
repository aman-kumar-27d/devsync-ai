'use client';

import DocsFrame from '@/components/docs/DocsFrame';

export default function WorkspacesChannelsDocsPage() {
    return (
        <DocsFrame
            title="Workspaces and channels"
            description="How to structure team communication and why channel organization matters."
            links={[
                { href: '/docs/user', label: 'User docs home' },
                { href: '/docs/user/chat-and-dms', label: 'Chat and DMs' },
                { href: '/docs/user/ai-assistant', label: 'AI assistant' },
            ]}
            toc={[
                { href: '#why-feature-exists', label: 'Why it exists' },
                { href: '#channel-setup', label: 'Channel setup' },
                { href: '#daily-pattern', label: 'Day-to-day pattern' },
            ]}
        >
            <div className="space-y-5">
                <article id="why-feature-exists" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Why this feature exists</h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                        Workspaces isolate members, permissions, and channels by project or team. Channels then split communication by topic so updates stay searchable and easy to follow.
                    </p>
                </article>

                <article id="channel-setup" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">How to set up a channel</h2>
                    <ol className="mt-4 space-y-3 text-sm leading-7 text-primary list-decimal pl-5">
                        <li>Open a workspace from your sidebar.</li>
                        <li>In the Channels section, click the plus icon.</li>
                        <li>Type a channel name and press Enter or Add.</li>
                        <li>Share channel purpose in the first message, for example, release-notes or bug-triage.</li>
                    </ol>
                </article>

                <article id="daily-pattern" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Day-to-day usage pattern</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Use one channel per recurring workflow: planning, bugs, releases, architecture.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Keep decision summaries in channel messages so new teammates can catch up quickly.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Use threads for side discussions to prevent main channels from becoming noisy.</li>
                    </ul>
                </article>
            </div>
        </DocsFrame>
    );
}