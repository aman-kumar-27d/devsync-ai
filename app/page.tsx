'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && user.workspaces?.length > 0) {
      router.replace(`/workspace/${user.workspaces[0]}`);
      return;
    }
    router.replace('/login');
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-primary">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <p className="text-muted text-xs">Loading workspace&hellip;</p>
      </div>
    </div>
  );
}
