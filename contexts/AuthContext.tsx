'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserData {
    _id: string;
    guestId: string;
    username: string;
    avatarColor: string;
    workspaces: string[];
}

interface AuthContextValue {
    user: UserData | null;
    loading: boolean;
    refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, refresh: () => { } });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    async function init() {
        setLoading(true);
        try {
            // Try to get existing session
            let res = await fetch('/api/auth/guest');
            if (res.status === 401) {
                // Create a new guest session
                res = await fetch('/api/auth/guest', { method: 'POST' });
            }
            const data = await res.json();
            setUser(data.user ?? null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { init(); }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refresh: init }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
