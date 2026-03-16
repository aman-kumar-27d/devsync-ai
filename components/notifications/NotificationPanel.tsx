'use client';

interface Notif {
    _id: string;
    type: string;
    read: boolean;
    senderId?: { username: string; avatarColor: string };
    createdAt: string;
}

interface Props {
    notifications: Notif[];
    onMarkAllRead: () => void;
    onClose: () => void;
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationPanel({ notifications, onMarkAllRead, onClose }: Props) {
    return (
        <div className="absolute bottom-8 right-0 z-50 w-72 rounded border border-subtle bg-secondary shadow-lg">
            <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
                <span className="text-sm font-semibold text-primary">Notifications</span>
                <div className="flex items-center gap-1">
                    <button onClick={onMarkAllRead} className="text-[10px] text-muted hover:text-primary hover-bg rounded px-1 py-0.5">
                        Mark all read
                    </button>
                    <button onClick={onClose} className="text-xs text-muted hover:text-primary hover-bg rounded p-0.5">✕</button>
                </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted">No notifications</p>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n._id}
                            className={`flex items-start gap-2 border-b border-subtle px-3 py-2 ${n.read ? 'opacity-50' : ''}`}
                        >
                            {n.senderId && (
                                <span
                                    className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold"
                                    style={{ backgroundColor: n.senderId.avatarColor ?? '#6366f1' }}
                                >
                                    {n.senderId.username?.[0]?.toUpperCase()}
                                </span>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-primary">
                                    {n.type === 'mention' && (
                                        <><strong>{n.senderId?.username}</strong> mentioned you</>
                                    )}
                                    {n.type === 'reply' && (
                                        <><strong>{n.senderId?.username}</strong> replied to your message</>
                                    )}
                                    {n.type === 'system' && 'System notification'}
                                </p>
                                <p className="text-[10px] text-muted">{formatTime(n.createdAt)}</p>
                            </div>
                            {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)] mt-1" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
