// Custom Node.js server: bootstraps Next.js + Socket.io on the same port
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

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
      const room = `dm:${[userId, peerId].sort().join('-')}`;
      socket.join(room);
      socket.data.dmRoom = room;
    });

    // Join per-user notification room
    socket.on('user:join', ({ userId }) => {
      socket.join(`user:${userId}`);
      socket.data.userId = userId;
    });

    // Send a message in a channel
    socket.on('message:send', (message) => {
      io.to(`channel:${message.channelId}`).emit('message:new', message);
      // Emit mention notifications
      const mentionPattern = /@([a-zA-Z0-9_-]+)/g;
      let match;
      while ((match = mentionPattern.exec(message.content)) !== null) {
        const username = match[1];
        io.emit('notification:mention', {
          recipientUsername: username,
          senderId: message.senderId,
          messageId: message._id,
          channelId: message.channelId,
        });
      }
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
