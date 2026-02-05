const express = require('express');
const app = express();

// Simple health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    success: true, 
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Google Drive Backend API - Test Mode' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});