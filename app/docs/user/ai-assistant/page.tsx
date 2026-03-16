'use client';

import DocsFrame from '@/components/docs/DocsFrame';

const aiModes = [
    {
        name: 'Chat',
        why: 'Quick architecture questions or coding direction while staying in context.',
        how: 'Ask high-level technical questions and request tradeoff analysis.',
    },
    {
        name: 'Code Generation',
        why: 'Accelerates boilerplate and repetitive code authoring.',
        how: 'Describe the function, expected input/output, and constraints, then refine output.',
    },
    {
        name: 'Bug Fix',
        why: 'Shortens debugging cycles for failing snippets and runtime errors.',
        how: 'Paste failing code plus error output and ask for root cause with corrected code.',
    },
    {
        name: 'Explain',
        why: 'Improves onboarding and review speed for unfamiliar code.',
        how: 'Paste a snippet and ask for step-by-step explanation with key assumptions.',
    },
    {
        name: 'Docs / Refactor',
        why: 'Keeps code readability and maintainability high in active projects.',
        how: 'Request inline docs, then ask for refactors that preserve behavior while improving clarity.',
    },
];

export default function AiAssistantDocsPage() {
    return (
        <DocsFrame
            title="AI assistant guide"
            description="Why each AI mode exists, how to use it, and where it helps in day-to-day engineering tasks."
            links={[
                { href: '/docs/user', label: 'User docs home' },
                { href: '/docs/user/workspaces-and-channels', label: 'Workspaces' },
                { href: '/docs/user/chat-and-dms', label: 'Chat and DMs' },
            ]}
            toc={[
                { href: '#how-to-open', label: 'Open and use AI' },
                { href: '#ai-modes', label: 'Mode guidance' },
                { href: '#best-practices', label: 'Best practices' },
            ]}
        >
            <div className="space-y-5">
                <article id="how-to-open" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">How to open and use AI</h2>
                    <ol className="mt-4 space-y-3 text-sm leading-7 text-primary list-decimal pl-5">
                        <li>Click the AI button in the header or use Ctrl/Cmd+/.</li>
                        <li>Select the mode that matches your task.</li>
                        <li>Provide relevant context: code, errors, expected output, and constraints.</li>
                        <li>Apply the response, then iterate with follow-up prompts.</li>
                    </ol>
                </article>

                <div id="ai-modes" className="grid gap-5 lg:grid-cols-2">
                    {aiModes.map((mode) => (
                        <article key={mode.name} className="rounded-[24px] border border-subtle bg-secondary p-6">
                            <h3 className="text-lg font-semibold text-primary">{mode.name}</h3>
                            <p className="mt-3 text-sm leading-7 text-primary"><span className="font-semibold">Why:</span> {mode.why}</p>
                            <p className="mt-2 text-sm leading-7 text-primary"><span className="font-semibold">How:</span> {mode.how}</p>
                        </article>
                    ))}
                </div>

                <article id="best-practices" className="rounded-[24px] border border-subtle bg-secondary p-6">
                    <h2 className="text-xl font-semibold text-primary">Daily best practices</h2>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Use precise prompts: include file intent, constraints, and expected format.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Keep prompts scoped to one problem at a time for higher quality responses.</li>
                        <li className="rounded-2xl border border-subtle bg-primary px-4 py-3">Validate generated code through build/tests before merging into team workflows.</li>
                    </ul>
                </article>
            </div>
        </DocsFrame>
    );
}