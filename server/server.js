const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Create HTTP server
const httpServer = http.createServer(app);

// Socket.IO server for HTTP
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.1.43:5173",
      "http://0.0.0.0:5173"
    ],
    methods: ["GET", "POST"]
  }
});

// Store rooms and their participants
const rooms = new Map();
const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user connection
  socket.on('user-connect', (userData) => {
    users.set(socket.id, userData);
    console.log('User registered:', userData.username);
  });

  // Handle joining a room
  socket.on('join-room', (data) => {
    const { roomId, userId, username } = data;
    
    // Leave current room if any
    if (socket.rooms.size > 1) {
      const currentRooms = Array.from(socket.rooms);
      const currentRoom = currentRooms.find(room => room !== socket.id);
      if (currentRoom) {
        socket.leave(currentRoom);
        handleUserLeave(currentRoom, userId);
      }
    }

    // Join new room
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        name: `Room ${roomId.slice(0, 8)}`,
        participants: []
      });
    }

    const room = rooms.get(roomId);
    const user = { id: userId, username };
    
    // Add user to room if not already present
    if (!room.participants.find(p => p.id === userId)) {
      room.participants.push(user);
    }

    // Notify user that they joined the room
    socket.emit('room-joined', room);
    
    // Notify other users in the room
    socket.to(roomId).emit('user-joined', user);
    
    // Send current participants to the new user
    socket.emit('room-participants', room.participants);
    
    console.log(`${username} joined room ${roomId}`);
  });

  // Handle leaving a room
  socket.on('leave-room', (data) => {
    const { roomId } = data;
    const user = users.get(socket.id);
    
    if (user) {
      handleUserLeave(roomId, user.id);
    }
    
    socket.leave(roomId);
    console.log(`User left room ${roomId}`);
  });

  // Handle WebRTC signaling
  socket.on('signal', (payload) => {
    console.log('Signal:', payload.type, 'from:', payload.from, 'to:', payload.to);
    
    // Forward the signal to the target user
    if (payload.to) {
      socket.to(payload.to).emit('signal', payload);
    } else if (payload.roomId) {
      // Broadcast to all users in the room except sender
      socket.to(payload.roomId).emit('signal', payload);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // Find and remove user from all rooms
      for (const [roomId, room] of rooms.entries()) {
        const userIndex = room.participants.findIndex(p => p.id === user.id);
        if (userIndex !== -1) {
          room.participants.splice(userIndex, 1);
          io.to(roomId).emit('user-left', user.id);
          io.to(roomId).emit('room-participants', room.participants);
          
          // Remove room if empty
          if (room.participants.length === 0) {
            rooms.delete(roomId);
          }
        }
      }
      users.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

function handleUserLeave(roomId, userId) {
  const room = rooms.get(roomId);
  if (room) {
    const userIndex = room.participants.findIndex(p => p.id === userId);
    if (userIndex !== -1) {
      room.participants.splice(userIndex, 1);
      io.to(roomId).emit('user-left', userId);
      io.to(roomId).emit('room-participants', room.participants);
      
      // Remove room if empty
      if (room.participants.length === 0) {
        rooms.delete(roomId);
      }
    }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    rooms: rooms.size, 
    users: users.size 
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

httpServer.listen(PORT, HOST, () => {
  console.log(`HTTP Server running on ${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.1.43:${PORT}`);
});
