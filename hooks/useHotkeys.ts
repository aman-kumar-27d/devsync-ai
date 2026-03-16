'use client';

import { useEffect } from 'react';

interface Shortcut {
    key: string;
    ctrl?: boolean;
    handler: () => void;
}

export function useHotkeys(shortcuts: Shortcut[]) {
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            for (const s of shortcuts) {
                const ctrlOk = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
                if (ctrlOk && e.key.toLowerCase() === s.key.toLowerCase()) {
                    e.preventDefault();
                    s.handler();
                    break;
                }
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [shortcuts]);
}
