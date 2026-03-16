import Link from 'next/link';

interface TocItem {
    href: string;
    label: string;
}

interface Props {
    items: TocItem[];
}

export default function DocsToc({ items }: Props) {
    if (items.length === 0) {
        return null;
    }

    return (
        <aside className="hidden xl:block xl:w-64 xl:flex-shrink-0">
            <div className="sticky top-28 rounded-2xl border border-subtle bg-secondary p-4 shadow-[0_14px_40px_rgba(15,17,23,0.08)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">On this page</p>
                <nav className="mt-3 space-y-1.5">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-lg px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted hover:bg-primary hover:text-primary"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}