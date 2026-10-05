const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get('/', (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const mongoState = mongoose.connection.readyState;
  const isHealthy = mongoState === 1;

  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    services: {
      api: 'Healthy',
      database: dbStateMap[mongoState] || 'Unknown',
    },
  });
});

module.exports = router;
