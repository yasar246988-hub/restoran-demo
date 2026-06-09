const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:8080",
      methods: ["GET", "POST"],
      credentials: false
    },
    transports: ['polling'],
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Join default room
    socket.join('restaurant');

    // Handle new orders
    socket.on('new_order', (orderData) => {
      console.log('📋 New order received:', orderData);
      socket.broadcast.to('restaurant').emit('new_order', orderData);
    });

    // Handle order updates
    socket.on('order_updated', (orderData) => {
      console.log('✏️ Order updated:', orderData);
      io.to('restaurant').emit('order_updated', orderData);
    });

    // Handle waiter calls
    socket.on('waiter_call', (callData) => {
      console.log('🔔 Waiter call:', callData);
      socket.broadcast.to('restaurant').emit('waiter_call', callData);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  // Set global io instance
  global.io = io;

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO }; 