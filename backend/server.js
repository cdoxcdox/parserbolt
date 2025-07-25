const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const telegramService = require('./services/telegramService');
const aiService = require('./services/aiService');
const dbService = require('./services/dbService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/channels', require('./routes/channels'));
app.use('/filters', require('./routes/filters'));
app.use('/parser', require('./routes/parser'));
app.use('/statistics', require('./routes/statistics'));
app.use('/logs', require('./routes/logs'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info('Client connected to WebSocket');
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected from WebSocket');
  });
});

// Initialize services
async function initializeServices() {
  try {
    await dbService.initialize();
    await telegramService.initialize();
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = { app, io };