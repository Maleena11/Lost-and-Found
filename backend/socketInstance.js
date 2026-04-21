// Singleton Socket.IO instance shared across the backend.
// index.js calls `init(httpServer)` once; every other module calls `getIO()`
// to obtain the same instance and emit events.

let io = null;

module.exports = {
  init(httpServer) {
    const { Server } = require('socket.io');
    io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:4173',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174',
          'http://127.0.0.1:4173',
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      socket.on('join_notifications', (email) => {
        if (email) {
          const normalized = String(email).toLowerCase();
          socket.join(normalized);
          console.log(`[Socket.IO] ${socket.id} joined room ${normalized}`);
        }
      });

      // Clients join a personal room keyed by their email so we can target
      // events at a specific user without broadcasting to everyone.
      socket.on('joinClaimRoom', (email) => {
        if (!email) return;

        if (email === '__admin__') {
          socket.join('admins');
          console.log(`[Socket.IO] ${socket.id} joined admins room`);
          return;
        }

        const normalized = String(email).toLowerCase();
        socket.join(`user:${normalized}`);
        socket.join(normalized);
        console.log(`[Socket.IO] ${socket.id} joined rooms user:${normalized}, ${normalized}`);
      });

      // Admin clients join a shared "admins" room
      socket.on('joinAdminRoom', () => {
        socket.join('admins');
        console.log(`[Socket.IO] ${socket.id} joined admins room`);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },

  getIO() {
    if (!io) throw new Error('Socket.IO has not been initialised — call init() first');
    return io;
  },
};
