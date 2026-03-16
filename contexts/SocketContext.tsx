'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;

        if (user) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit('user:join', { userId: user._id });
        } else if (socket.connected) {
            socket.disconnect();
        }

        return () => {
            // Don't disconnect — keep singleton alive across navigations
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
