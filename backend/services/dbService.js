const { Pool } = require('pg');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  async initialize() {
    try {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'postgres',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'telegram_parser',
        user: process.env.DB_USER || 'parser_user',
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      await this.pool.query('SELECT NOW()');
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async getActiveChannels() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM channels WHERE is_active = true ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting active channels:', error);
      return [];
    }
  }

  async addChannel(channelData) {
    try {
      const result = await this.pool.query(
        `INSERT INTO channels (username, title, is_source, is_excluded, is_active) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [channelData.username, channelData.title, channelData.isSource, channelData.isExcluded, true]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding channel:', error);
      throw error;
    }
  }

  async updateChannel(channelId, updates) {
    try {
      const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = [channelId, ...Object.values(updates)];
      
      const result = await this.pool.query(
        `UPDATE channels SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating channel:', error);
      throw error;
    }
  }

  async deleteChannel(channelId) {
    try {
      await this.pool.query('DELETE FROM channels WHERE id = $1', [channelId]);
      return true;
    } catch (error) {
      logger.error('Error deleting channel:', error);
      throw error;
    }
  }

  async getFilterSettings() {
    try {
      const result = await this.pool.query('SELECT * FROM filter_settings ORDER BY created_at DESC LIMIT 1');
      return result.rows[0] || this.getDefaultFilterSettings();
    } catch (error) {
      logger.error('Error getting filter settings:', error);
      return this.getDefaultFilterSettings();
    }
  }

  async updateFilterSettings(settings) {
    try {
      const result = await this.pool.query(
        `INSERT INTO filter_settings (spam_keywords, allowed_keywords, min_text_length, max_text_length, 
         filter_media, similarity_threshold, use_ai, ai_provider) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          JSON.stringify(settings.spamKeywords),
          JSON.stringify(settings.allowedKeywords),
          settings.minTextLength,
          settings.maxTextLength,
          settings.filterMedia,
          settings.similarityThreshold,
          settings.useAI,
          settings.aiProvider
        ]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating filter settings:', error);
      throw error;
    }
  }

  async getParserSettings() {
    try {
      const result = await this.pool.query('SELECT * FROM parser_settings ORDER BY created_at DESC LIMIT 1');
      return result.rows[0] || this.getDefaultParserSettings();
    } catch (error) {
      logger.error('Error getting parser settings:', error);
      return this.getDefaultParserSettings();
    }
  }

  async updateParserSettings(settings) {
    try {
      const result = await this.pool.query(
        `INSERT INTO parser_settings (check_interval, antispam_delay_min, antispam_delay_max, 
         max_messages_per_hour, target_channel, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          settings.checkInterval,
          settings.antispamDelay.min,
          settings.antispamDelay.max,
          settings.maxMessagesPerHour,
          settings.targetChannel,
          settings.isActive
        ]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating parser settings:', error);
      throw error;
    }
  }

  async logMessage(message, action) {
    try {
      await this.pool.query(
        `INSERT INTO message_logs (message_id, channel_id, content, action, timestamp) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [message.id, message.channelId || null, message.text, action]
      );
    } catch (error) {
      logger.error('Error logging message:', error);
    }
  }

  async isMessageProcessed(messageId) {
    try {
      const result = await this.pool.query(
        'SELECT id FROM message_logs WHERE message_id = $1 AND action = $2',
        [messageId, 'forwarded']
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking if message processed:', error);
      return false;
    }
  }

  async getStatistics() {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_checked,
          COUNT(*) FILTER (WHERE action = 'forwarded') as total_forwarded,
          COUNT(*) FILTER (WHERE action = 'spam_filtered') as spam_filtered,
          COUNT(*) FILTER (WHERE action = 'duplicate_filtered') as duplicates_filtered,
          COUNT(*) FILTER (WHERE action = 'error') as errors_count,
          MAX(timestamp) as last_run
        FROM message_logs 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
      `);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting statistics:', error);
      return {
        total_checked: 0,
        total_forwarded: 0,
        spam_filtered: 0,
        duplicates_filtered: 0,
        errors_count: 0,
        last_run: null
      };
    }
  }

  async getLogs(limit = 100, level = 'all') {
    try {
      let query = 'SELECT * FROM message_logs';
      let params = [];
      
      if (level !== 'all') {
        query += ' WHERE action = $1';
        params.push(level);
      }
      
      query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting logs:', error);
      return [];
    }
  }

  getDefaultFilterSettings() {
    return {
      spamKeywords: ['реклама', 'скидка', 'промокод', 'купить', 'заработок'],
      allowedKeywords: ['новости', 'технологии', 'обновление'],
      minTextLength: 50,
      maxTextLength: 4000,
      filterMedia: false,
      similarityThreshold: 0.8,
      useAI: true,
      aiProvider: 'openrouter'
    };
  }

  getDefaultParserSettings() {
    return {
      checkInterval: 5,
      antispamDelay: { min: 30, max: 120 },
      maxMessagesPerHour: 20,
      targetChannel: '@mytargetchannel',
      isActive: false
    };
  }
}

module.exports = new DatabaseService();