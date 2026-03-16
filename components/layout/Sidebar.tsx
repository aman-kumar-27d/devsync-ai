'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import toast from 'react-hot-toast';

interface WorkspaceData {
    _id: string;
    name: string;
    channels: { _id: string; name: string; type: string }[];
    members: { _id: string; username: string; avatarColor: string }[];
    inviteToken: string;
}

interface Props {
    workspace: WorkspaceData | null;
    onToggleAi: () => void;
}

export default function Sidebar({ workspace, onToggleAi }: Props) {
    const { user, logout } = useAuth();
    const params = useParams<{ id: string; channelId?: string; userId?: string }>();
    const router = useRouter();
    const [newChannelName, setNewChannelName] = useState('');
    const [showAddChannel, setShowAddChannel] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    async function createChannel() {
        if (!newChannelName.trim() || !workspace) return;
        const res = await fetch(`/api/workspaces/${workspace._id}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newChannelName }),
        });
        if (res.ok) {
            const data = await res.json();
            setNewChannelName('');
            setShowAddChannel(false);
            router.push(`/workspace/${workspace._id}/channel/${data.channel._id}`);
            router.refresh();
        } else {
            toast.error('Failed to create channel');
        }
    }

    function copyInvite() {
        if (!workspace) return;
        navigator.clipboard.writeText(workspace.inviteToken);
        toast.success('Invite token copied!');
    }

    if (collapsed) {
        return (
            <aside className="flex w-12 flex-col items-center border-r border-subtle bg-secondary py-3 gap-3">
                <button
                    onClick={() => setCollapsed(false)}
                    className="text-muted hover:text-primary text-lg"
                    title="Expand sidebar"
                >
                    ›
                </button>
                <button onClick={onToggleAi} className="text-muted hover:text-primary text-lg" title="AI Assistant">
                    ✦
                </button>
            </aside>
        );
    }

    return (
        <aside className="flex w-60 flex-shrink-0 flex-col border-r border-subtle bg-secondary">
            {/* Workspace header */}
            <div className="flex items-center justify-between border-b border-subtle px-3 py-3">
                <span className="font-semibold text-primary truncate">{workspace?.name ?? '…'}</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={copyInvite}
                        className="rounded p-1 text-muted hover:text-primary hover-bg text-xs"
                        title="Copy invite token"
                    >
                        ⎘
                    </button>
                    <button
                        onClick={() => setCollapsed(true)}
                        className="rounded p-1 text-muted hover:text-primary hover-bg text-xs"
                        title="Collapse sidebar"
                    >
                        ‹
                    </button>
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto px-2 py-2 gap-4">
                {/* Channels */}
                <section>
                    <div className="flex items-center justify-between px-1 py-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Channels</span>
                        <button
                            onClick={() => setShowAddChannel((p) => !p)}
                            className="text-muted hover:text-primary text-sm hover-bg rounded px-1"
                            title="Add channel"
                        >
                            +
                        </button>
                    </div>
                    {showAddChannel && (
                        <div className="flex gap-1 px-1 py-1">
                            <input
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') createChannel(); if (e.key === 'Escape') setShowAddChannel(false); }}
                                placeholder="channel-name"
                                className="flex-1 rounded border border-subtle bg-primary px-2 py-1 text-xs text-primary outline-none focus:border-[var(--accent)]"
                                autoFocus
                            />
                            <button
                                onClick={createChannel}
                                className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white hover:bg-[var(--accent-hover)]"
                            >
                                Add
                            </button>
                        </div>
                    )}
                    <ul className="mt-1 space-y-0.5">
                        {workspace?.channels.map((ch) => (
                            <li key={ch._id}>
                                <Link
                                    href={`/workspace/${workspace._id}/channel/${ch._id}`}
                                    className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm hover-bg ${params.channelId === ch._id
                                        ? 'bg-[var(--accent)] text-white'
                                        : 'text-muted hover:text-primary'
                                        }`}
                                >
                                    <span className="opacity-60">#</span>
                                    {ch.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Members / DMs */}
                <section>
                    <div className="px-1 py-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Members</span>
                    </div>
                    <ul className="mt-1 space-y-0.5">
                        {workspace?.members
                            .filter((m) => m._id !== user?._id)
                            .map((m) => (
                                <li key={m._id}>
                                    <Link
                                        href={`/workspace/${workspace._id}/dm/${m._id}`}
                                        className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm hover-bg ${params.userId === m._id
                                            ? 'bg-[var(--accent)] text-white'
                                            : 'text-muted hover:text-primary'
                                            }`}
                                    >
                                        <span
                                            className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                                            style={{ backgroundColor: m.avatarColor }}
                                        >
                                            {m.username[0].toUpperCase()}
                                        </span>
                                        <span className="truncate">{m.username}</span>
                                    </Link>
                                </li>
                            ))}
                    </ul>
                </section>
            </div>

            {/* Current user footer */}
            <div className="flex items-center justify-between border-t border-subtle px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                        style={{ backgroundColor: user?.avatarColor ?? '#6366f1' }}
                    >
                        {user?.username?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <span className="truncate text-xs text-muted">{user?.username}</span>
                </div>
                <div className="flex items-center gap-1">
                    <NotificationBell workspaceId={workspace?._id} />
                    <button
                        onClick={async () => { await logout(); router.replace('/login'); }}
                        className="rounded p-1 text-muted hover:text-primary hover-bg text-sm"
                        title="Logout"
                    >
                        ⇥
                    </button>
                    <button
                        onClick={onToggleAi}
                        className="rounded p-1 text-muted hover:text-[var(--accent)] hover-bg text-sm"
                        title="AI Assistant"
                    >
                        ✦
                    </button>
                </div>
            </div>
        </aside>
    );
}
