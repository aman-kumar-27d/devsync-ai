'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MessageList from '@/components/chat/MessageList';
import MessageComposer from '@/components/chat/MessageComposer';
import TypingIndicator from '@/components/chat/TypingIndicator';
import AiPanel from '@/components/ai/AiPanel';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import type { MessageData } from '@/types/chat';
import { useHotkeys } from '@/hooks/useHotkeys';

interface WorkspaceData {
    _id: string;
    name: string;
    channels: { _id: string; name: string; type: string }[];
    members: { _id: string; username: string; avatarColor: string }[];
    inviteToken: string;
}

export default function DmPage() {
    const { id: workspaceId, userId: peerId } = useParams<{ id: string; userId: string }>();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
    const [messages, setMessages] = useState<MessageData[]>([]);
    const [aiOpen, setAiOpen] = useState(false);
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

    useEffect(() => {
        if (!workspaceId) return;
        fetch(`/api/workspaces/${workspaceId}`)
            .then((r) => r.json())
            .then((d) => setWorkspace(d.workspace))
            .catch(console.error);
    }, [workspaceId]);

    const loadMessages = useCallback(async () => {
        if (!peerId) return;
        setLoadingMsgs(true);
        try {
            const res = await fetch(`/api/dm/${peerId}/messages`);
            const data = await res.json();
            setMessages(data.messages ?? []);
        } finally {
            setLoadingMsgs(false);
        }
    }, [peerId]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    useEffect(() => {
        if (!user || !peerId) return;
        const socket = getSocket();
        socket.emit('dm:join', { userId: user._id, peerId });

        const onNew = (msg: MessageData) => {
            setMessages((prev) => [...prev, msg]);
        };
        const onTypingStart = ({ userId, username }: { userId: string; username: string }) => {
            setTypingUsers((prev) => { const n = new Map(prev); n.set(userId, username); return n; });
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
        socket.on('message:new', onNew);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);
        return () => {
            socket.off('message:new', onNew);
            socket.off('typing:start', onTypingStart);
            socket.off('typing:stop', onTypingStop);
            typingTimers.current.forEach((t) => clearTimeout(t));
            typingTimers.current.clear();
        };
    }, [user, peerId]);

    const peer = workspace?.members.find((m) => m._id === peerId);
    const peerName = peer?.username ?? 'Direct Message';

    return (
        <div className="flex h-screen overflow-hidden bg-primary">
            <Sidebar workspace={workspace} onToggleAi={() => setAiOpen((p) => !p)} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <Header
                    workspace={workspace}
                    channelName={`@ ${peerName}`}
                    onToggleAi={() => setAiOpen((p) => !p)}
                    aiOpen={aiOpen}
                    searchOpen={searchOpen}
                    onSearchOpenChange={setSearchOpen}
                />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <MessageList
                        messages={messages}
                        loading={loadingMsgs}
                        currentUserId={user?._id ?? ''}
                        channelId=""
                    />
                    <TypingIndicator usernames={Array.from(typingUsers.values())} />
                    <MessageComposer peerId={peerId} workspaceId={workspaceId} />
                </div>
            </main>
            {aiOpen && <AiPanel onClose={() => setAiOpen(false)} workspaceId={workspaceId} />}
        </div>
    );
}
