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

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT'],
  },
});

// documentId -> Map(socketId -> user)
const documentPresence = new Map();

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  // Join document room
  socket.on('join-document', async ({ documentId, user }) => {
    socket.join(documentId);

    socket.documentId = documentId;
    socket.user = user;

    if (!documentPresence.has(documentId)) {
      documentPresence.set(documentId, new Map());
    }

    documentPresence.get(documentId).set(socket.id, user);

    // Send updated online users to everyone
    const onlineUsers = Array.from(
      documentPresence.get(documentId).values()
    );

    io.to(documentId).emit('presence-update', onlineUsers);

    // Load document once for this socket
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

  // Realtime document changes
socket.on('document-change', async data => {
  try {
    const { documentId, content, userId } = data;

    // Load document
    const document = await Document.findById(documentId);

    if (!document || document.isDeleted) {
      return;
    }

    // Owner can edit
    let canEdit =
      document.owner.toString() === userId;

    // Collaborator with editor role can edit
    if (!canEdit) {
      const collaborator = document.collaborators.find(
        c => c.user.toString() === userId
      );

      canEdit =
        collaborator && collaborator.role === 'editor';
    }

    // Block viewers
    if (!canEdit) {
      socket.emit('edit-denied', {
        message: 'You have view-only access',
      });
      return;
    }

    // Broadcast to others
    socket.to(documentId).emit('receive-document-change', {
      content,
    });

    // Save to MongoDB
    document.content = content;
    document.lastEditedBy = userId;
    document.lastEditedAt = new Date();

    await document.save();

    console.log(
      `Document ${documentId} saved by ${userId}`
    );
  } catch (error) {
    console.error(
      'Realtime save error:',
      error.message
    );
  }
});

socket.on('typing-start', ({ documentId, name }) => {
  socket.to(documentId).emit('user-typing', {
    socketId: socket.id,
    name,
  });
});

socket.on('typing-stop', ({ documentId }) => {
  socket.to(documentId).emit('user-stop-typing', {
    socketId: socket.id,
  });
});

  // Disconnect cleanup
  socket.on('disconnect', () => {
    const documentId = socket.documentId;

    if (documentId && documentPresence.has(documentId)) {
      documentPresence.get(documentId).delete(socket.id);

      const onlineUsers = Array.from(
        documentPresence.get(documentId).values()
      );

      io.to(documentId).emit('presence-update', onlineUsers);

      if (documentPresence.get(documentId).size === 0) {
        documentPresence.delete(documentId);
      }
    }

    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});