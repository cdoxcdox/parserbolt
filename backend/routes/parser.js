const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');

// Get parser settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await dbService.getParserSettings();
    res.json(settings);
  } catch (error) {
    logger.error('Error getting parser settings:', error);
    res.status(500).json({ error: 'Failed to get parser settings' });
  }
});

// Update parser settings
router.post('/settings', async (req, res) => {
  try {
    const settings = await dbService.updateParserSettings(req.body);
    res.json(settings);
  } catch (error) {
    logger.error('Error updating parser settings:', error);
    res.status(500).json({ error: 'Failed to update parser settings' });
  }
});

// Start parser
router.post('/start', async (req, res) => {
  try {
    const settings = await dbService.getParserSettings();
    await telegramService.startParser(settings);
    res.json({ status: 'started' });
  } catch (error) {
    logger.error('Error starting parser:', error);
    res.status(500).json({ error: 'Failed to start parser' });
  }
});

// Stop parser
router.post('/stop', async (req, res) => {
  try {
    await telegramService.stopParser();
    res.json({ status: 'stopped' });
  } catch (error) {
    logger.error('Error stopping parser:', error);
    res.status(500).json({ error: 'Failed to stop parser' });
  }
});

// Get parser status
router.get('/status', (req, res) => {
  res.json({ 
    isRunning: telegramService.isRunning,
    status: telegramService.isRunning ? 'running' : 'stopped'
  });
});

module.exports = router;