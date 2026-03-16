'use client';

interface Props {
    usernames: string[];
}

export default function TypingIndicator({ usernames }: Props) {
    if (usernames.length === 0) return null;

    let label: string;
    if (usernames.length === 1) {
        label = `${usernames[0]} is typing`;
    } else if (usernames.length === 2) {
        label = `${usernames[0]} and ${usernames[1]} are typing`;
    } else {
        label = 'Several people are typing';
    }

    return (
        <div className="flex items-center gap-1.5 px-4 pb-1 text-xs text-muted select-none">
            {/* Animated pulse dots */}
            <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
            </span>
            <span>{label}&hellip;</span>
        </div>
    );
}
