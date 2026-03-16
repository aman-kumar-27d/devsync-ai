'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import toast from 'react-hot-toast';
import CodeComposer from '@/components/code/CodeComposer';
import FileUploadButton from '@/components/files/FileUploadButton';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
    channelId?: string;
    peerId?: string;
    workspaceId?: string;
    threadId?: string;
    placeholder?: string;
    onSent?: () => void;
}

export default function MessageComposer({ channelId, peerId, workspaceId, threadId, placeholder, onSent }: Props) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [showCodeComposer, setShowCodeComposer] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    const getTypingRoom = useCallback((): string | null => {
        if (channelId) return `channel:${channelId}`;
        if (peerId && user) return `dm:${[user._id, peerId].sort().join('-')}`;
        return null;
    }, [channelId, peerId, user]);

    const emitTypingStop = useCallback(() => {
        const roomId = getTypingRoom();
        if (!roomId || !user || !isTypingRef.current) return;
        isTypingRef.current = false;
        getSocket().emit('typing:stop', { roomId, userId: user._id });
    }, [getTypingRoom, user]);

    const emitTypingStart = useCallback(() => {
        const roomId = getTypingRoom();
        if (!roomId || !user) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            getSocket().emit('typing:start', { roomId, userId: user._id, username: user.username });
        }
        // Reset inactivity timer
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            emitTypingStop();
        }, 3000);
    }, [getTypingRoom, user, emitTypingStop]);

    async function send() {
        const trimmed = content.trim();
        if (!trimmed || sending) return;
        setSending(true);
        // Stop typing indicator immediately on send
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        emitTypingStop();
        try {
            let url: string;
            let body: Record<string, unknown>;

            if (peerId) {
                url = `/api/dm/${peerId}/messages`;
                body = { content: trimmed };
            } else {
                url = `/api/channels/${channelId}/messages`;
                body = { content: trimmed, type: 'text' };
                if (threadId) body.threadId = threadId;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('send failed');
            setContent('');
            onSent?.();
        } catch {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    }

    function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }

    // Detect /code slash command
    function onChange(val: string) {
        if (val === '/code') {
            setContent('');
            setShowCodeComposer(true);
            emitTypingStop();
        } else {
            setContent(val);
            if (val.trim()) {
                emitTypingStart();
            } else {
                emitTypingStop();
            }
        }
        // Auto-resize
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
        }
    }

    return (
        <div className="border-t border-subtle bg-secondary px-4 py-2">
            {showCodeComposer && (
                <CodeComposer
                    onClose={() => setShowCodeComposer(false)}
                    channelId={channelId}
                    workspaceId={workspaceId}
                    threadId={threadId}
                />
            )}
            <div className="flex items-end gap-2 rounded border border-subtle bg-primary px-3 py-2 focus-within:border-[var(--accent)]">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={emitTypingStop}
                    placeholder={placeholder ?? 'Message… (type /code for a snippet)'}
                    disabled={sending}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm text-primary outline-none placeholder:text-muted"
                    style={{ maxHeight: '200px' }}
                />
                <div className="flex items-center gap-1 pb-0.5">
                    <FileUploadButton workspaceId={workspaceId} channelId={channelId} threadId={threadId} />
                    <button
                        onClick={() => setShowCodeComposer(true)}
                        className="rounded p-1.5 text-muted hover:text-primary hover-bg text-xs"
                        title="Insert code snippet"
                    >
                        {'</>'}
                    </button>
                    <button
                        onClick={send}
                        disabled={sending || !content.trim()}
                        className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {sending ? '…' : 'Send'}
                    </button>
                </div>
            </div>
            <p className="mt-1 text-[10px] text-muted">Enter to send · Shift+Enter for new line</p>
        </div>
    );
}
