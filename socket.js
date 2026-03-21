const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name}`);

    // Join a board room
    socket.on('join_board', (boardId) => {
      socket.join(boardId);
      socket.to(boardId).emit('user_joined', { user: socket.user.name });
    });

    // Leave a board room
    socket.on('leave_board', (boardId) => {
      socket.leave(boardId);
    });

    // Task moved
    socket.on('task_moved', (data) => {
      socket.to(data.boardId).emit('task_moved', data);
    });

    // Task updated
    socket.on('task_updated', (data) => {
      socket.to(data.boardId).emit('task_updated', data);
    });

    // New comment
    socket.on('new_comment', (data) => {
      socket.to(data.boardId).emit('new_comment', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
}; 