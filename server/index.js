require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const trafficRoutes = require('./routes/trafficRoutes');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/auth');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/traffic', authMiddleware, trafficRoutes);
const scanRoutes = require('./routes/scanRoutes');
app.use('/api/scan', authMiddleware, scanRoutes);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cybersecurity';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Database: cybersecurity');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('Client connected to socket.io');
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from socket.io');
      });
    });
    
    // Make io available globally for routes
    global.io = io;
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
