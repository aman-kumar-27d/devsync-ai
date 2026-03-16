import type { ReactNode } from 'react';

interface Props {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    children: ReactNode;
}

export default function DocsSection({ id, eyebrow, title, description, children }: Props) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">{eyebrow}</p>
                <h2 className="mt-3 text-3xl font-semibold text-primary sm:text-4xl">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted sm:text-base">{description}</p>
            </div>
            <div className="mt-8">{children}</div>
        </section>
    );
}