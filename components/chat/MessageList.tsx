'use client';

import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import type { MessageData } from '@/types/chat';

interface Props {
    messages: MessageData[];
    loading: boolean;
    currentUserId: string;
    channelId: string;
    onOpenThread?: (msg: MessageData) => void;
    onExplainSnippet?: (code: string) => void;
}

export default function MessageList({ messages, loading, currentUserId, channelId, onOpenThread, onExplainSnippet }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-muted text-xs">No messages yet. Be the first to say something!</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="flex flex-1 flex-col overflow-y-auto px-4 py-2 gap-0.5">
            {messages.map((msg, i) => {
                const prevMsg = messages[i - 1];
                if (!msg) return null;

                const prevSenderId = prevMsg?.senderId?._id;
                const currentSenderId = msg.senderId?._id;
                const canCompareTime = Boolean(prevMsg?.createdAt && msg.createdAt && prevSenderId && currentSenderId);
                const sameSender =
                    canCompareTime &&
                    prevSenderId === currentSenderId &&
                    new Date(msg.createdAt).getTime() - new Date(prevMsg!.createdAt).getTime() < 5 * 60 * 1000;
                return (
                    <MessageItem
                        key={msg._id}
                        message={msg}
                        isOwn={msg.senderId?._id === currentUserId}
                        compact={sameSender}
                        channelId={channelId}
                        onOpenThread={onOpenThread}
                        onExplainSnippet={onExplainSnippet}
                    />
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
