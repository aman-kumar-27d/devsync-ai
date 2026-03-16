'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MessageList from '@/components/chat/MessageList';
import MessageComposer from '@/components/chat/MessageComposer';
import ThreadPanel from '@/components/chat/ThreadPanel';
import TypingIndicator from '@/components/chat/TypingIndicator';
import AiPanel from '@/components/ai/AiPanel';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import { useHotkeys } from '@/hooks/useHotkeys';

interface WorkspaceData {
    _id: string;
    name: string;
    channels: { _id: string; name: string; type: string }[];
    members: { _id: string; username: string; avatarColor: string }[];
    inviteToken: string;
}

import type { MessageData } from '@/types/chat';

export default function ChannelPage() {
    const { id: workspaceId, channelId } = useParams<{ id: string; channelId: string }>();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [threadMessage, setThreadMessage] = useState<MessageData | null>(null);
    const [aiOpen, setAiOpen] = useState(false);
    const [aiSnippet, setAiSnippet] = useState<string | undefined>();
    const [searchOpen, setSearchOpen] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useHotkeys([
        { key: 'k', ctrl: true, handler: () => setSearchOpen(true) },
        { key: '/', ctrl: true, handler: () => setAiOpen((p) => !p) },
        { key: 'Escape', handler: () => setSearchOpen(false) },
    ]);

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    // Load workspace
    useEffect(() => {
        if (!workspaceId) return;
        fetch(`/api/workspaces/${workspaceId}`)
            .then((r) => r.json())
            .then((d) => setWorkspace(d.workspace))
            .catch(console.error);
    }, [workspaceId]);

    // Load messages
    const loadMessages = useCallback(async () => {
        if (!channelId) return;
        setLoadingMsgs(true);
        try {
            const res = await fetch(`/api/channels/${channelId}/messages`);
            const data = await res.json();
            setMessages(data.messages ?? []);
        } finally {
            setLoadingMsgs(false);
        }
    }, [channelId]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    // Socket.io subscriptions
    useEffect(() => {
        if (!channelId) return;
        const socket = getSocket();
        socket.emit('channel:join', { channelId });

        const onNew = (msg: MessageData) => {
            if (msg.channelId === channelId && !msg.threadId) {
                setMessages((prev) => [...prev, msg]);
            }
        };
        const onEdited = (data: Partial<MessageData>) => {
            setMessages((prev) =>
                prev.map((m) => (m._id === data._id ? { ...m, ...data } : m))
            );
        };
        const onDeleted = (data: { _id: string }) => {
            setMessages((prev) =>
                prev.map((m) => (m._id === data._id ? { ...m, deletedAt: new Date().toISOString() } : m))
            );
        };
        const onReacted = (data: { _id: string; reactions: MessageData['reactions'] }) => {
            setMessages((prev) =>
                prev.map((m) => (m._id === data._id ? { ...m, reactions: data.reactions } : m))
            );
        };

        socket.on('message:new', onNew);
        socket.on('message:edited', onEdited);
        socket.on('message:deleted', onDeleted);
        socket.on('message:reacted', onReacted);

        const onTypingStart = ({ userId, username }: { userId: string; username: string }) => {
            setTypingUsers((prev) => {
                const next = new Map(prev);
                next.set(userId, username);
                return next;
            });
            // Auto-clear after 5s if no stop event arrives
            const existing = typingTimers.current.get(userId);
            if (existing) clearTimeout(existing);
            typingTimers.current.set(userId, setTimeout(() => {
                setTypingUsers((prev) => { const n = new Map(prev); n.delete(userId); return n; });
            }, 5000));
        };
        const onTypingStop = ({ userId }: { userId: string }) => {
            const t = typingTimers.current.get(userId);
            if (t) { clearTimeout(t); typingTimers.current.delete(userId); }
            setTypingUsers((prev) => { const n = new Map(prev); n.delete(userId); return n; });
        };
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);

        return () => {
            socket.emit('channel:leave', { channelId });
            socket.off('message:new', onNew);
            socket.off('message:edited', onEdited);
            socket.off('message:deleted', onDeleted);
            socket.off('message:reacted', onReacted);
            socket.off('typing:start', onTypingStart);
            socket.off('typing:stop', onTypingStop);
            typingTimers.current.forEach((t) => clearTimeout(t));
            typingTimers.current.clear();
        };
    }, [channelId]);

    const handleExplainSnippet = (code: string) => {
        setAiSnippet(code);
        setAiOpen(true);
    };

    const channelName = workspace?.channels.find((c) => c._id === channelId)?.name ?? '';

    return (
        <div className="flex h-screen overflow-hidden bg-primary">
            <Sidebar workspace={workspace} onToggleAi={() => setAiOpen((p) => !p)} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <Header
                    workspace={workspace}
                    channelName={channelName}
                    onToggleAi={() => setAiOpen((p) => !p)}
                    aiOpen={aiOpen}
                    searchOpen={searchOpen}
                    onSearchOpenChange={setSearchOpen}
                />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <MessageList
                            messages={messages}
                            loading={loadingMsgs}
                            currentUserId={user?._id ?? ''}
                            onOpenThread={setThreadMessage}
                            onExplainSnippet={handleExplainSnippet}
                            channelId={channelId}
                        />
                        <TypingIndicator usernames={Array.from(typingUsers.values())} />
                        <MessageComposer channelId={channelId} workspaceId={workspaceId} />
                    </div>
                    {threadMessage && (
                        <ThreadPanel
                            parentMessage={threadMessage}
                            channelId={channelId}
                            currentUserId={user?._id ?? ''}
                            onClose={() => setThreadMessage(null)}
                        />
                    )}
                </div>
            </main>
            {aiOpen && (
                <AiPanel
                    onClose={() => { setAiOpen(false); setAiSnippet(undefined); }}
                    initialSnippet={aiSnippet}
                    workspaceId={workspaceId}
                />
            )}
        </div>
    );
}
