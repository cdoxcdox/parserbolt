const { TelegramApi } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const logger = require('../utils/logger');
const dbService = require('./dbService');
const aiService = require('./aiService');

class TelegramService {
  constructor() {
    this.client = null;
    this.isRunning = false;
    this.checkInterval = null;
  }

  async initialize() {
    try {
      const apiId = parseInt(process.env.TELEGRAM_API_ID);
      const apiHash = process.env.TELEGRAM_API_HASH;
      const stringSession = new StringSession(process.env.TELEGRAM_SESSION || '');

      this.client = new TelegramApi(stringSession, apiId, apiHash, {
        connectionRetries: 5,
      });

      await this.client.start({
        phoneNumber: async () => await input.text('Please enter your number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => logger.error('Telegram auth error:', err),
      });

      logger.info('Telegram client initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Telegram client:', error);
      throw error;
    }
  }

  async getChannelMessages(channelUsername, limit = 10) {
    try {
      const messages = await this.client.getMessages(channelUsername, { limit });
      return messages.map(msg => ({
        id: msg.id,
        text: msg.text || '',
        date: msg.date,
        media: msg.media ? {
          type: msg.media.className,
          hasPhoto: !!msg.photo,
          hasVideo: !!msg.video,
          hasDocument: !!msg.document
        } : null,
        fromId: msg.fromId?.userId || null
      }));
    } catch (error) {
      logger.error(`Failed to get messages from ${channelUsername}:`, error);
      throw error;
    }
  }

  async forwardMessage(fromChannel, toChannel, messageId) {
    try {
      await this.client.forwardMessages(toChannel, {
        messages: [messageId],
        fromPeer: fromChannel
      });
      logger.info(`Message ${messageId} forwarded from ${fromChannel} to ${toChannel}`);
      return true;
    } catch (error) {
      logger.error(`Failed to forward message ${messageId}:`, error);
      throw error;
    }
  }

  async startParser(settings) {
    if (this.isRunning) {
      logger.warn('Parser is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting Telegram parser with settings:', settings);

    this.checkInterval = setInterval(async () => {
      await this.checkChannels(settings);
    }, settings.checkInterval * 60 * 1000);

    // Initial check
    await this.checkChannels(settings);
  }

  async stopParser() {
    if (!this.isRunning) {
      logger.warn('Parser is not running');
      return;
    }

    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    logger.info('Telegram parser stopped');
  }

  async checkChannels(settings) {
    try {
      const channels = await dbService.getActiveChannels();
      const filters = await dbService.getFilterSettings();

      for (const channel of channels) {
        if (!channel.isSource || channel.isExcluded) continue;

        const messages = await this.getChannelMessages(channel.username, 5);
        
        for (const message of messages) {
          const shouldForward = await this.shouldForwardMessage(message, filters);
          
          if (shouldForward) {
            // Add random delay for anti-flood protection
            const delay = Math.random() * 
              (settings.antispamDelay.max - settings.antispamDelay.min) + 
              settings.antispamDelay.min;
            
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
            
            await this.forwardMessage(
              channel.username, 
              settings.targetChannel, 
              message.id
            );

            await dbService.logMessage(message, 'forwarded');
          }
        }
      }
    } catch (error) {
      logger.error('Error checking channels:', error);
    }
  }

  async shouldForwardMessage(message, filters) {
    try {
      // Check text length
      if (message.text.length < filters.minTextLength || 
          message.text.length > filters.maxTextLength) {
        return false;
      }

      // Check spam keywords
      const hasSpamKeywords = filters.spamKeywords.some(keyword => 
        message.text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasSpamKeywords) {
        await dbService.logMessage(message, 'spam_filtered');
        return false;
      }

      // Check allowed keywords
      if (filters.allowedKeywords.length > 0) {
        const hasAllowedKeywords = filters.allowedKeywords.some(keyword => 
          message.text.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasAllowedKeywords) {
          return false;
        }
      }

      // Check for duplicates using AI
      if (filters.useAI) {
        const isDuplicate = await aiService.checkDuplicate(
          message.text, 
          filters.similarityThreshold,
          filters.aiProvider
        );
        if (isDuplicate) {
          await dbService.logMessage(message, 'duplicate_filtered');
          return false;
        }
      }

      // Check if already processed
      const isProcessed = await dbService.isMessageProcessed(message.id);
      if (isProcessed) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking message:', error);
      return false;
    }
  }
}

module.exports = new TelegramService();