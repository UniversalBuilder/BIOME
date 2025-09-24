const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import your existing backend routes
const projectRoutes = require('./backend/src/routes/projects');
const userRoutes = require('./backend/src/routes/users');
const groupRoutes = require('./backend/src/routes/groups');
const dbManager = require('./backend/src/database/db');

// For logging
const winston = require('winston');

// Set up logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'biome-production' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'production-error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'production.log') 
    })
  ]
});

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'projet-analyse-image-frontend/build')));

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'projet-analyse-image-frontend/build', 'index.html'));
});

// Initialize database and start server
dbManager.connect()
  .then(() => {
    logger.info('Database connected successfully');
    app.listen(PORT, () => {
      logger.info(`Production server running on port ${PORT}`);
      console.log(`🚀 BIOME Production Server running on port ${PORT}`);
      console.log(`📱 Access your app at: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    logger.error('Failed to connect to database:', err);
    console.error('Failed to start server:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
