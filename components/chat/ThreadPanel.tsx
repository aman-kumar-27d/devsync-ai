'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import type { MessageData } from '@/types/chat';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';

interface Props {
    parentMessage: MessageData;
    channelId: string;
    currentUserId: string;
    onClose: () => void;
}

export default function ThreadPanel({ parentMessage, channelId, currentUserId, onClose }: Props) {
    const [replies, setReplies] = useState<MessageData[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReplies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/channels/${channelId}/messages?threadId=${parentMessage._id}`);
            const data = await res.json();
            setReplies(data.messages ?? []);
        } finally {
            setLoading(false);
        }
    }, [channelId, parentMessage._id]);

    useEffect(() => { loadReplies(); }, [loadReplies]);

    useEffect(() => {
        const socket = getSocket();
        const onNew = (msg: MessageData) => {
            if (msg.threadId === parentMessage._id) {
                setReplies((prev) => [...prev, msg]);
            }
        };
        socket.on('thread:new', onNew);
        return () => { socket.off('thread:new', onNew); };
    }, [parentMessage._id]);

    return (
        <div className="flex w-72 flex-col border-l border-subtle bg-secondary">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
                <span className="text-sm font-semibold text-primary">Thread</span>
                <button onClick={onClose} className="rounded p-1 text-muted hover:text-primary hover-bg text-xs">✕</button>
            </div>

            {/* Parent message */}
            <div className="border-b border-subtle px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                    <span
                        className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold"
                        style={{ backgroundColor: parentMessage.senderId?.avatarColor ?? '#6366f1' }}
                    >
                        {parentMessage.senderId?.username?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <span className="text-xs font-semibold text-primary">{parentMessage.senderId?.username}</span>
                </div>
                <p className="text-xs text-muted truncate">{parentMessage.content}</p>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-hidden">
                <MessageList
                    messages={replies}
                    loading={loading}
                    currentUserId={currentUserId}
                    channelId={channelId}
                />
            </div>

            {/* Reply composer */}
            <MessageComposer
                channelId={channelId}
                threadId={parentMessage._id}
                placeholder="Reply in thread…"
            />
        </div>
    );
}
