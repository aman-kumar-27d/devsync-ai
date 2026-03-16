'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const result = await register({ email, username, password });
        setSubmitting(false);

        if (!result.ok) {
            setError(result.error ?? 'Registration failed');
            return;
        }

        router.replace('/');
        router.refresh();
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-primary px-4 py-10">
            <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-subtle bg-secondary p-6 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">DevCollab AI</p>
                <h1 className="mt-3 text-2xl font-semibold text-primary">Create Account</h1>
                <p className="mt-1 text-sm text-muted">Use a real account instead of guest access.</p>

                <div className="mt-6 space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-xs text-muted">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-subtle bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-[var(--accent)]"
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs text-muted">Username</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-lg border border-subtle bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-[var(--accent)]"
                            minLength={3}
                            maxLength={24}
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs text-muted">Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-subtle bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-[var(--accent)]"
                            minLength={8}
                            required
                        />
                    </label>
                </div>

                {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                    {submitting ? 'Creating account...' : 'Create account'}
                </button>

                <p className="mt-4 text-sm text-muted">
                    Already have an account? <Link href="/login" className="text-[var(--accent)] hover:underline">Login</Link>
                </p>
            </form>
        </main>
    );
}
