const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const logger = require('../utils/logger');

// Get statistics
router.get('/', async (req, res) => {
  try {
    const stats = await dbService.getStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;