'use client';

import Link from 'next/link';
import DocsFrame from '@/components/docs/DocsFrame';
import DocsCodeBlock from '@/components/docs/DocsCodeBlock';
import DocsSection from '@/components/docs/DocsSection';
import {
    environmentVariables,
    platformFeatures,
    productivityNotes,
    repoHighlights,
    repoUrl,
    scripts,
    setupSteps,
    troubleshootingItems,
    userGuideSections,
} from '@/components/docs/docsContent';

const sectionLinks = [
    { href: '#tracks', label: 'Documentation tracks' },
    { href: '#user-guide', label: 'User section' },
    { href: '#open-source', label: 'Open-source section' },
];

export default function DocumentationPage() {
    return (
        <DocsFrame
            title="Platform docs and open-source setup"
            description="A clear split between user operations and open-source contributor setup."
        >
            <section
                id="overview"
                className="relative overflow-hidden rounded-[32px] border border-subtle px-6 py-8 shadow-[0_28px_80px_rgba(15,17,23,0.14)] sm:px-8 sm:py-10"
                style={{
                    background:
                        'radial-gradient(circle at top left, rgba(99, 102, 241, 0.24), transparent 30%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.18), transparent 28%), linear-gradient(135deg, var(--bg-secondary), var(--bg))',
                }}
            >
                <div
                    className="absolute right-0 top-0 h-48 w-48 rounded-full blur-3xl"
                    style={{ backgroundColor: 'rgba(99, 102, 241, 0.10)' }}
                />
                <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                            <span
                                className="rounded-full border px-3 py-1"
                                style={{
                                    borderColor: 'rgba(99, 102, 241, 0.20)',
                                    backgroundColor: 'rgba(99, 102, 241, 0.10)',
                                }}
                            >
                                Logged-in Docs
                            </span>
                            <span className="rounded-full border border-subtle bg-secondary px-3 py-1 text-muted">Two-track guide</span>
                        </div>
                        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-primary sm:text-5xl">
                            Everything a user needs to operate DevCollab AI and everything a contributor needs to run it locally.
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                            This page keeps product usage, feature guidance, setup commands, and repository entry points in one place so a logged-in teammate can move between the app and the codebase without digging through separate notes.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/docs/user"
                                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)]"
                            >
                                User docs
                            </Link>
                            <Link
                                href="/docs/open-source"
                                className="rounded-full border border-subtle bg-secondary px-4 py-2 text-sm font-medium text-primary transition hover:bg-[var(--bg-hover)]"
                            >
                                Open-source docs
                            </Link>
                            <a
                                href={repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-subtle bg-secondary px-4 py-2 text-sm font-medium text-primary transition hover:bg-[var(--bg-hover)]"
                            >
                                GitHub repository
                            </a>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-subtle bg-[rgba(11,16,32,0.92)] p-5 text-slate-100 shadow-[0_20px_50px_rgba(11,16,32,0.34)]">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                            <span>Fast start</span>
                            <span>local</span>
                        </div>
                        <pre className="mt-4 overflow-x-auto text-[13px] leading-6 text-slate-100">
                            <code>{`git clone ${repoUrl}\ncd devsync-ai\nnpm install\nnpm run dev`}</code>
                        </pre>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">User track</p>
                                <p className="mt-2 text-sm text-slate-100">Learn workspaces, messaging, AI, snippets, files, search, and notifications.</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">Open source track</p>
                                <p className="mt-2 text-sm text-slate-100">Clone the repo, configure env vars, run locally, and validate the app.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 rounded-[24px] border border-subtle bg-secondary p-5" id="overview-toc">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">On this page</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {sectionLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="rounded-full border border-subtle bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            </section>

            <div className="space-y-20 pb-12 pt-8">
                <div className="grid gap-4 md:grid-cols-2" id="tracks">
                    <Link
                        href="/docs/user"
                        className="rounded-[22px] border border-subtle bg-secondary p-5 hover:border-[var(--accent)]"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">User docs</p>
                        <h2 className="mt-2 text-xl font-semibold text-primary">Detailed feature pages</h2>
                        <p className="mt-2 text-sm leading-7 text-muted">Open pages that explain why each user feature exists, how to use it, and how it helps in day-to-day tasks.</p>
                    </Link>
                    <Link
                        href="/docs/open-source"
                        className="rounded-[22px] border border-subtle bg-secondary p-5 hover:border-[var(--accent)]"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Open source docs</p>
                        <h2 className="mt-2 text-xl font-semibold text-primary">Detailed setup pages</h2>
                        <p className="mt-2 text-sm leading-7 text-muted">Get dedicated pages for local setup, MongoDB setup, Redis setup, and project-level rationale.</p>
                    </Link>
                </div>

                <DocsSection
                    id="user-guide"
                    eyebrow="Section 1"
                    title="Using the platform as a user"
                    description="This guide covers the product-side workflows that matter most in daily use: account access, collaboration spaces, direct communication, AI-assisted coding, and the productivity tools layered on top."
                >
                    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
                            {userGuideSections.map((section) => (
                                <article key={section.title} className="rounded-[28px] border border-subtle bg-secondary p-6 shadow-[0_16px_50px_rgba(15,17,23,0.08)]">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Workflow</p>
                                    <h3 className="mt-3 text-xl font-semibold text-primary">{section.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-muted">{section.description}</p>
                                    <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                                        {section.bullets.map((bullet) => (
                                            <li key={bullet} className="flex gap-3">
                                                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>

                        <div className="space-y-5">
                            <article className="rounded-[28px] border border-subtle bg-secondary p-6">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Features</p>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                                    {platformFeatures.map((feature) => (
                                        <div key={feature.title} className="rounded-2xl border border-subtle bg-primary p-4">
                                            <h3 className="text-base font-semibold text-primary">{feature.title}</h3>
                                            <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <article className="rounded-[28px] border border-subtle bg-secondary p-6">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Shortcuts and habits</p>
                                <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                                    {productivityNotes.map((item) => (
                                        <li key={item} className="rounded-2xl border border-subtle bg-primary px-4 py-3">{item}</li>
                                    ))}
                                </ul>
                            </article>

                            <article className="rounded-[28px] border border-subtle bg-secondary p-6">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Troubleshooting</p>
                                <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                                    {troubleshootingItems.map((item) => (
                                        <li key={item} className="flex gap-3 rounded-2xl border border-subtle bg-primary px-4 py-3">
                                            <span className="text-[var(--accent)]">!</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>
                    </div>
                </DocsSection>

                <DocsSection
                    id="open-source"
                    eyebrow="Section 2"
                    title="Using the code as open source and running it locally"
                    description="This track is anchored to the current repository setup. It shows the GitHub source, the local environment you need, the commands to run, and the scripts available for development, build, and QA."
                >
                    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-5">
                            {setupSteps.map((step) => (
                                <article key={step.title} className="rounded-[28px] border border-subtle bg-secondary p-5 shadow-[0_16px_50px_rgba(15,17,23,0.08)]">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Setup step</p>
                                            <h3 className="mt-2 text-xl font-semibold text-primary">{step.title}</h3>
                                            <p className="mt-2 text-sm leading-7 text-muted">{step.description}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <DocsCodeBlock title={step.title} code={step.code} label={step.label} />
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="space-y-5">
                            <article className="rounded-[28px] border border-subtle bg-secondary p-6">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Repository highlights</p>
                                <ul className="mt-4 space-y-3 text-sm leading-7 text-primary">
                                    {repoHighlights.map((item) => (
                                        <li key={item} className="rounded-2xl border border-subtle bg-primary px-4 py-3">{item}</li>
                                    ))}
                                </ul>
                            </article>

                            <article className="rounded-[28px] border border-subtle bg-secondary p-6">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Environment variables</p>
                                <div className="mt-4 space-y-3">
                                    {environmentVariables.map((item) => (
                                        <div key={item.name} className="rounded-2xl border border-subtle bg-primary px-4 py-3">
                                            <p className="text-sm font-semibold text-primary">{item.name}</p>
                                            <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <article className="rounded-[28px] border border-subtle bg-secondary p-6">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Useful scripts</p>
                                <div className="mt-4 space-y-3">
                                    {scripts.map((script) => (
                                        <div key={script.name} className="rounded-2xl border border-subtle bg-primary px-4 py-3">
                                            <p className="text-sm font-semibold text-primary">{script.name}</p>
                                            <p className="mt-1 text-sm leading-6 text-muted">{script.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        </div>
                    </div>
                </DocsSection>
            </div>
        </DocsFrame>
    );
}