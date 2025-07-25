const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const logger = require('../utils/logger');

// Get logs
router.get('/', async (req, res) => {
  try {
    const { limit = 100, level = 'all' } = req.query;
    const logs = await dbService.getLogs(parseInt(limit), level);
    res.json(logs);
  } catch (error) {
    logger.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

module.exports = router;