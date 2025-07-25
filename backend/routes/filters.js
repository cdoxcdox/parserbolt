const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const logger = require('../utils/logger');

// Get filter settings
router.get('/', async (req, res) => {
  try {
    const settings = await dbService.getFilterSettings();
    res.json(settings);
  } catch (error) {
    logger.error('Error getting filter settings:', error);
    res.status(500).json({ error: 'Failed to get filter settings' });
  }
});

// Update filter settings
router.post('/', async (req, res) => {
  try {
    const settings = await dbService.updateFilterSettings(req.body);
    res.json(settings);
  } catch (error) {
    logger.error('Error updating filter settings:', error);
    res.status(500).json({ error: 'Failed to update filter settings' });
  }
});

module.exports = router;