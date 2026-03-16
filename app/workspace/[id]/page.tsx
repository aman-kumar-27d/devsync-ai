'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import AiPanel from '@/components/ai/AiPanel';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceData {
    _id: string;
    name: string;
    channels: { _id: string; name: string; type: string }[];
    members: { _id: string; username: string; avatarColor: string }[];
    inviteToken: string;
}

export default function WorkspacePage() {
    const { id } = useParams<{ id: string }>();
    const { user, loading } = useAuth();
    const router = useRouter();
    const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
    const [aiOpen, setAiOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/workspaces/${id}`)
            .then((r) => r.json())
            .then((d) => {
                setWorkspace(d.workspace);
                // Redirect to first channel
                if (d.workspace?.channels?.length > 0) {
                    router.replace(`/workspace/${id}/channel/${d.workspace.channels[0]._id}`);
                }
            })
            .catch(console.error);
    }, [id, router]);

    if (loading || !workspace) {
        return (
            <div className="flex h-screen items-center justify-center bg-primary">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-primary">
            <Sidebar workspace={workspace} onToggleAi={() => setAiOpen((p) => !p)} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <Header workspace={workspace} onToggleAi={() => setAiOpen((p) => !p)} aiOpen={aiOpen} />
                <div className="flex-1 flex items-center justify-center text-muted text-xs">
                    Select a channel to start chatting
                </div>
            </main>
            {aiOpen && <AiPanel onClose={() => setAiOpen(false)} />}
        </div>
    );
}
