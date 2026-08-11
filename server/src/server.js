import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';

import connectDB from './config/db.js';
import Document from './models/Document.js';

const PORT = process.env.PORT || 5000;

// Connect MongoDB
await connectDB();

// Create HTTP server from Express app
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// documentId -> Map(socketId -> userInfo)
const documentPresence = new Map();

// Socket connection
io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

socket.on('join-document', async data => {
  const { documentId, user } = data;

  socket.join(documentId);

  console.log(
    `Socket ${socket.id} joined document ${documentId}`
  );

  // Store info on socket for disconnect cleanup
  socket.documentId = documentId;
  socket.user = user;

  // Create room map if missing
  if (!documentPresence.has(documentId)) {
    documentPresence.set(documentId, new Map());
  }

  // Add current user
  documentPresence
    .get(documentId)
    .set(socket.id, user);

  // Send current online users to everyone in room
  const onlineUsers = Array.from(
    documentPresence.get(documentId).values()
  );

  io.to(documentId).emit('presence-update', onlineUsers);

  // Notify others
  socket.to(documentId).emit('user-joined', {
    name: user.name,
  });

  // Load document content
  try {
    const document = await Document.findById(documentId);

    if (document) {
      socket.emit('load-document', {
        content: document.content,
      });
    }
  } catch (error) {
    console.error('Load document error:', error.message);
  }
});

// Receive document changes
socket.on('document-change', async data => {
  try {
    const { documentId, content, userId } = data;

    // 1. Broadcast to other collaborators
    socket.to(documentId).emit('receive-document-change', {
      content,
    });

    // 2. Save latest content to MongoDB
    await Document.findByIdAndUpdate(documentId, {
      content,
      lastEditedBy: userId,
      lastEditedAt: new Date(),
    });

    console.log(`Document ${documentId} saved`);
  } catch (error) {
    console.error('Realtime save error:', error.message);
  }
});

socket.on('typing-start', data => {
  socket.to(data.documentId).emit('user-typing', {
    name: data.name,
  });
});

socket.on('typing-stop', data => {
  socket.to(data.documentId).emit('user-stop-typing', {
    name: data.name,
  });
});

socket.on('disconnect', () => {
  console.log('Socket disconnected:', socket.id);

  const documentId = socket.documentId;
  const user = socket.user;

  if (
    documentId &&
    documentPresence.has(documentId)
  ) {
    // Remove disconnected user
    documentPresence
      .get(documentId)
      .delete(socket.id);

    // Updated online users
    const onlineUsers = Array.from(
      documentPresence.get(documentId).values()
    );

    io.to(documentId).emit(
      'presence-update',
      onlineUsers
    );

    // Notify room
    if (user) {
      io.to(documentId).emit('user-left', {
        name: user.name,
      });
    }

    // Remove empty room map
    if (
      documentPresence.get(documentId).size === 0
    ) {
      documentPresence.delete(documentId);
    }
  }
});
});

// Start server
server.listen(PORT, () => {
  console.log(`--- Server running on port ${PORT} ---`);
});