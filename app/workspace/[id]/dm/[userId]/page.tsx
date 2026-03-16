'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MessageList from '@/components/chat/MessageList';
import MessageComposer from '@/components/chat/MessageComposer';
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

    useHotkeys([
        { key: 'k', ctrl: true, handler: () => setSearchOpen(true) },
        { key: '/', ctrl: true, handler: () => setAiOpen((p) => !p) },
        { key: 'Escape', handler: () => setSearchOpen(false) },
    ]);

    useEffect(() => {
        if (!loading && !user) router.replace('/');
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
        socket.on('message:new', onNew);
        return () => { socket.off('message:new', onNew); };
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
                    <MessageComposer peerId={peerId} workspaceId={workspaceId} />
                </div>
            </main>
            {aiOpen && <AiPanel onClose={() => setAiOpen(false)} />}
        </div>
    );
}
