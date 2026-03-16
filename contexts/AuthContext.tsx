'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface UserData {
    _id: string;
    email: string;
    username: string;
    avatarColor: string;
    workspaces: string[];
}

interface AuthContextValue {
    user: UserData | null;
    loading: boolean;
    login: (input: { email: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
    register: (input: { email: string; username: string; password: string }) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
    refresh: () => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    login: async () => ({ ok: false, error: 'Not initialized' }),
    register: async () => ({ ok: false, error: 'Not initialized' }),
    logout: async () => { },
    refresh: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    async function init() {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/me', { cache: 'no-store' });
            if (res.status === 401) {
                setUser(null);
                return;
            }
            const data = await res.json();
            setUser(data.user ?? null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(input: { email: string; password: string }) {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error ?? 'Login failed' };
            setUser(data.user ?? null);
            return { ok: true };
        } catch {
            return { ok: false, error: 'Login failed' };
        }
    }

    async function register(input: { email: string; username: string; password: string }) {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) return { ok: false, error: data.error ?? 'Registration failed' };
            setUser(data.user ?? null);
            return { ok: true };
        } catch {
            return { ok: false, error: 'Registration failed' };
        }
    }

    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
    }

    useEffect(() => { init(); }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: init }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
