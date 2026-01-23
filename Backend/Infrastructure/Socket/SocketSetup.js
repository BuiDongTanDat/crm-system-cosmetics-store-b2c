const { Server } = require('socket.io');
const socketAuthMiddleware = require('../../API/Middleware/socketMiddleware');

let io; // Biến toàn cục
function setupSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      // Đảm bảo origin này khớp hoàn toàn với URL frontend (không dư dấu / ở cuối)
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Sử dụng middleware xác thực cho socket.io
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log('Socket connected:', socket.id);
    console.log('Authenticated user:', user.full_name, user.email);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io server not initialized yet.');
  return io;
}

module.exports = { setupSocketServer, getIO };