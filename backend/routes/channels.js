const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const logger = require('../utils/logger');

// Get all channels
router.get('/', async (req, res) => {
  try {
    const channels = await dbService.getActiveChannels();
    res.json(channels);
  } catch (error) {
    logger.error('Error getting channels:', error);
    res.status(500).json({ error: 'Failed to get channels' });
  }
});

// Add new channel
router.post('/', async (req, res) => {
  try {
    const channel = await dbService.addChannel(req.body);
    res.status(201).json(channel);
  } catch (error) {
    logger.error('Error adding channel:', error);
    res.status(500).json({ error: 'Failed to add channel' });
  }
});

// Update channel
router.put('/:id', async (req, res) => {
  try {
    const channel = await dbService.updateChannel(req.params.id, req.body);
    res.json(channel);
  } catch (error) {
    logger.error('Error updating channel:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Delete channel
router.delete('/:id', async (req, res) => {
  try {
    await dbService.deleteChannel(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

module.exports = router;