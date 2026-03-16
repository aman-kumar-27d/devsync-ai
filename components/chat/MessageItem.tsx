'use client';

import { useState } from 'react';
import type { MessageData } from '@/types/chat';
import SnippetCard from '@/components/code/SnippetCard';
import toast from 'react-hot-toast';

interface Props {
    message: MessageData;
    isOwn: boolean;
    compact: boolean;
    channelId?: string;
    onOpenThread?: (msg: MessageData) => void;
    onExplainSnippet?: (code: string) => void;
}

const EMOJI_QUICK = ['👍', '❤️', '😂', '🚀', '👀', '✅'];

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageItem({ message, isOwn, compact, onOpenThread, onExplainSnippet }: Props) {
    const [showActions, setShowActions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    if (message.deletedAt) {
        return (
            <div className="px-2 py-0.5 text-xs italic text-muted">
                This message was deleted.
            </div>
        );
    }

    async function handleEdit() {
        if (editContent.trim() === message.content) { setEditing(false); return; }
        const res = await fetch(`/api/messages/${message._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent }),
        });
        if (!res.ok) { toast.error('Failed to edit message'); return; }
        setEditing(false);
    }

    async function handleDelete() {
        if (!confirm('Delete this message?')) return;
        const res = await fetch(`/api/messages/${message._id}`, { method: 'DELETE' });
        if (!res.ok) toast.error('Failed to delete message');
    }

    async function handleReact(emoji: string) {
        setShowEmojiPicker(false);
        await fetch(`/api/messages/${message._id}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emoji }),
        });
    }

    const sender = message.senderId;

    return (
        <div
            className="group relative flex gap-2 rounded px-2 py-1 hover-bg"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
        >
            {/* Avatar or spacer */}
            {!compact ? (
                <span
                    className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: sender?.avatarColor ?? '#6366f1' }}
                >
                    {sender?.username?.[0]?.toUpperCase() ?? '?'}
                </span>
            ) : (
                <span className="w-7 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
                {!compact && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`text-sm font-semibold ${isOwn ? 'text-[var(--accent)]' : 'text-primary'}`}>
                            {sender?.username ?? 'Unknown'}
                        </span>
                        <span className="text-[10px] text-muted">{formatTime(message.createdAt)}</span>
                        {message.editedAt && <span className="text-[10px] text-muted">(edited)</span>}
                    </div>
                )}

                {/* Content */}
                {editing ? (
                    <div className="flex gap-2">
                        <input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditing(false); }}
                            className="flex-1 rounded border border-subtle bg-primary px-2 py-1 text-sm text-primary outline-none focus:border-[var(--accent)]"
                            autoFocus
                        />
                        <button onClick={handleEdit} className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white">Save</button>
                        <button onClick={() => setEditing(false)} className="rounded px-2 py-1 text-xs text-muted hover-bg">Cancel</button>
                    </div>
                ) : message.type === 'code' ? (
                    <SnippetCard
                        content={message.content}
                        onExplain={onExplainSnippet}
                    />
                ) : (
                    <p className="text-sm text-primary whitespace-pre-wrap break-words">{message.content}</p>
                )}

                {/* Reactions */}
                {message.reactions?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {message.reactions.map((r) => (
                            <button
                                key={r.emoji}
                                onClick={() => handleReact(r.emoji)}
                                className="inline-flex items-center gap-1 rounded-full border border-subtle bg-secondary px-1.5 py-0.5 text-xs hover-bg"
                            >
                                {r.emoji} <span className="text-muted">{r.userIds.length}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Action bar */}
            {showActions && !editing && (
                <div className="absolute right-2 top-0 -translate-y-1/2 flex items-center gap-0.5 rounded border border-subtle bg-secondary shadow-sm z-10">
                    {/* Emoji */}
                    <div className="relative">
                        <button
                            onClick={() => setShowEmojiPicker((p) => !p)}
                            className="rounded px-1.5 py-1 text-xs text-muted hover:text-primary hover-bg"
                            title="React"
                        >
                            😊
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute right-0 top-full mt-1 flex gap-1 rounded border border-subtle bg-secondary p-1 shadow-lg z-20">
                                {EMOJI_QUICK.map((e) => (
                                    <button key={e} onClick={() => handleReact(e)} className="hover-bg rounded px-1 py-0.5 text-sm">
                                        {e}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Thread */}
                    {onOpenThread && (
                        <button
                            onClick={() => onOpenThread(message)}
                            className="rounded px-1.5 py-1 text-xs text-muted hover:text-primary hover-bg"
                            title="Reply in thread"
                        >
                            ↩
                        </button>
                    )}
                    {/* Edit / Delete (own messages) */}
                    {isOwn && (
                        <>
                            <button
                                onClick={() => { setEditing(true); setShowActions(false); }}
                                className="rounded px-1.5 py-1 text-xs text-muted hover:text-primary hover-bg"
                                title="Edit"
                            >
                                ✎
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded px-1.5 py-1 text-xs text-muted hover:text-red-500 hover-bg"
                                title="Delete"
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
