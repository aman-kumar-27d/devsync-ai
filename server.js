// Custom Node.js server: bootstraps Next.js + Socket.io on the same port
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// In-process socket event rate limiter (fixed-window, per-user per-event).
// Falls back gracefully if userId is absent (join-only events are not limited).
// For horizontal-scale deployments, swap _socketRlStore for a Redis-backed
// variant using the same INCR+EXPIRE pattern as lib/rateLimiter.ts.
// ---------------------------------------------------------------------------
const _socketRlStore = new Map(); // key -> count
let _socketRlLastPrune = Date.now();

function socketAllowed(userId, event, limit, windowSeconds) {
    if (!userId) return true; // unauthenticated sockets are handled by io.use middleware
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Prune stale entries every 5 minutes
    if (now - _socketRlLastPrune > 5 * 60 * 1000) {
        _socketRlStore.forEach(function (_, k) {
            const ts = Number(k.split(':')[2]);
            if (!isNaN(ts) && ts < now - windowMs * 2) {
                _socketRlStore.delete(k);
            }
        });
        _socketRlLastPrune = now;
    }

    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = event + ':' + userId + ':' + windowStart;
    const count = (_socketRlStore.get(key) || 0) + 1;
    _socketRlStore.set(key, count);
    return count <= limit;
}
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'devcollab-ai-local-jwt-secret';

function parseCookies(cookieHeader = '') {
    return cookieHeader
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((acc, part) => {
            const index = part.indexOf('=');
            if (index === -1) return acc;
            const key = part.slice(0, index);
            const value = decodeURIComponent(part.slice(index + 1));
            acc[key] = value;
            return acc;
        }, {});
}

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        // Let Socket.IO handle its own HTTP long-polling requests.
        if (req.url && req.url.startsWith('/socket.io')) {
            return;
        }
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
    });

    io.use((socket, nextSocket) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie);
            const token = cookies.authToken;
            if (!token) {
                return nextSocket(new Error('Unauthorized'));
            }

            const payload = jwt.verify(token, JWT_SECRET);
            socket.data.userId = payload.userId;
            return nextSocket();
        } catch {
            return nextSocket(new Error('Unauthorized'));
        }
    });

    // Make io accessible to API routes via global
    global.io = io;

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join a channel room
        socket.on('channel:join', ({ channelId }) => {
            socket.join(`channel:${channelId}`);
        });

        socket.on('channel:leave', ({ channelId }) => {
            socket.leave(`channel:${channelId}`);
        });

        // Join a DM room (sorted pair to ensure uniqueness)
        socket.on('dm:join', ({ userId, peerId }) => {
            if (!socket.data.userId || socket.data.userId !== userId) {
                return;
            }
            const room = `dm:${[userId, peerId].sort().join('-')}`;
            socket.join(room);
            socket.data.dmRoom = room;
        });

        // Join per-user notification room
        socket.on('user:join', ({ userId }) => {
            if (!socket.data.userId || socket.data.userId !== userId) {
                return;
            }
            socket.join(`user:${userId}`);
            socket.data.userId = userId;
        });

        // Send a message in a channel (rate-limited: 20 per minute per user)
        socket.on('message:send', (message) => {
            if (!socketAllowed(socket.data.userId, 'msg_send', 20, 60)) {
                socket.emit('rate:limited', { event: 'message:send', retryAfterSeconds: 60 });
                return;
            }
            io.to(`channel:${message.channelId}`).emit('message:new', message);
        });

        // Send a DM (rate-limited: 20 per minute per user)
        socket.on('dm:send', (message) => {
            if (!socketAllowed(socket.data.userId, 'dm_send', 20, 60)) {
                socket.emit('rate:limited', { event: 'dm:send', retryAfterSeconds: 60 });
                return;
            }
            const room = `dm:${[message.senderId, message.recipientId].sort().join('-')}`;
            io.to(room).emit('message:new', message);
        });

        // Edit a message
        socket.on('message:edit', (data) => {
            io.to(`channel:${data.channelId}`).emit('message:edited', data);
        });

        // Delete a message (soft)
        socket.on('message:delete', (data) => {
            io.to(`channel:${data.channelId}`).emit('message:deleted', data);
        });

        // React to a message (rate-limited: 30 per minute per user)
        socket.on('message:react', (data) => {
            if (!socketAllowed(socket.data.userId, 'msg_react', 30, 60)) {
                socket.emit('rate:limited', { event: 'message:react', retryAfterSeconds: 60 });
                return;
            }
            io.to(`channel:${data.channelId}`).emit('message:reacted', data);
        });

        // Thread reply (rate-limited: 20 per minute per user)
        socket.on('thread:reply', (message) => {
            if (!socketAllowed(socket.data.userId, 'thread_reply', 20, 60)) {
                socket.emit('rate:limited', { event: 'thread:reply', retryAfterSeconds: 60 });
                return;
            }
            io.to(`channel:${message.channelId}`).emit('thread:new', message);
        });

        // Typing indicators — broadcast to room, exclude sender
        socket.on('typing:start', ({ roomId, userId, username }) => {
            if (!socket.data.userId || !roomId || !userId || !username) return;
            socket.to(roomId).emit('typing:start', { roomId, userId, username });
        });

        socket.on('typing:stop', ({ roomId, userId }) => {
            if (!socket.data.userId || !roomId || !userId) return;
            socket.to(roomId).emit('typing:stop', { roomId, userId });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    httpServer.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT} (${dev ? 'dev' : 'prod'})`);
    });
});
