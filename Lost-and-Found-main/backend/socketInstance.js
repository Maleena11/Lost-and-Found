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

      // Clients join a personal room keyed by their email so we can target
      // events at a specific user without broadcasting to everyone.
      socket.on('joinClaimRoom', (email) => {
        if (email) {
          socket.join(`user:${email}`);
          console.log(`[Socket.IO] ${socket.id} joined room user:${email}`);
        }
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
