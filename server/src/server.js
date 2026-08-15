import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import connectDB from './config/db.js';
import Document from './models/Document.js';
import { initializeSocket } from './services/socketService.js';


const PORT = process.env.PORT || 5000;

// Connect MongoDB
await connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);



server.listen(PORT, '0.0.0.0', () => {
  console.log(`--- Server running on port ${PORT} ---`);
});