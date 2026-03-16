'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import NotificationPanel from './NotificationPanel';

interface Props {
    workspaceId?: string;
}

interface Notif {
    _id: string;
    type: string;
    read: boolean;
    senderId?: { username: string; avatarColor: string };
    createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function NotificationBell({ workspaceId }: Props) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notif[]>([]);
    const [open, setOpen] = useState(false);

    const unread = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        fetch('/api/notifications')
            .then((r) => r.json())
            .then((d) => setNotifications(d.notifications ?? []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!user) return;
        const socket = getSocket();
        const handler = (data: Notif) => {
            setNotifications((prev) => [data, ...prev]);
        };
        socket.on('notification:mention', handler);
        return () => { socket.off('notification:mention', handler); };
    }, [user]);

    async function markAllRead() {
        await fetch('/api/notifications', { method: 'PATCH' });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((p) => !p)}
                className="relative rounded p-1 text-muted hover:text-primary hover-bg text-sm"
                title="Notifications"
            >
                🔔
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
            {open && (
                <NotificationPanel
                    notifications={notifications}
                    onMarkAllRead={markAllRead}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}
