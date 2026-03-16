// Custom Node.js server: bootstraps Next.js + Socket.io on the same port
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
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

        // Send a message in a channel
        socket.on('message:send', (message) => {
            io.to(`channel:${message.channelId}`).emit('message:new', message);
        });

        // Send a DM
        socket.on('dm:send', (message) => {
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

        // React to a message
        socket.on('message:react', (data) => {
            io.to(`channel:${data.channelId}`).emit('message:reacted', data);
        });

        // Thread reply
        socket.on('thread:reply', (message) => {
            io.to(`channel:${message.channelId}`).emit('thread:new', message);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    httpServer.listen(PORT, () => {
        console.log(`> Ready on http://localhost:${PORT} (${dev ? 'dev' : 'prod'})`);
    });
});
