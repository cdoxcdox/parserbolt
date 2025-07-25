const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.processedMessages = new Map(); // In-memory cache for processed messages
  }

  async checkDuplicate(messageText, threshold = 0.8, provider = 'openrouter') {
    try {
      // Simple similarity check with cached messages
      for (const [id, cachedText] of this.processedMessages) {
        const similarity = this.calculateSimilarity(messageText, cachedText);
        if (similarity >= threshold) {
          logger.info(`Duplicate detected with similarity: ${similarity}`);
          return true;
        }
      }

      // Use AI service for more advanced duplicate detection
      const isDuplicate = await this.checkWithAI(messageText, provider);
      
      // Cache the message
      this.processedMessages.set(Date.now(), messageText);
      
      // Keep only last 1000 messages in cache
      if (this.processedMessages.size > 1000) {
        const firstKey = this.processedMessages.keys().next().value;
        this.processedMessages.delete(firstKey);
      }

      return isDuplicate;
    } catch (error) {
      logger.error('Error checking duplicate:', error);
      return false;
    }
  }

  async checkWithAI(messageText, provider) {
    try {
      switch (provider) {
        case 'openrouter':
          return await this.checkWithOpenRouter(messageText);
        case 'together':
          return await this.checkWithTogether(messageText);
        case 'huggingface':
          return await this.checkWithHuggingFace(messageText);
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Error with AI provider ${provider}:`, error);
      return false;
    }
  }

  async checkWithOpenRouter(messageText) {
    try {
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: 'microsoft/dialoGPT-medium',
        messages: [{
          role: 'user',
          content: `Analyze this message for spam content and return only "true" or "false": "${messageText}"`
        }],
        max_tokens: 10
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.choices[0].message.content.toLowerCase().trim();
      return result === 'true';
    } catch (error) {
      logger.error('OpenRouter API error:', error);
      return false;
    }
  }

  async checkWithTogether(messageText) {
    try {
      const response = await axios.post('https://api.together.xyz/inference', {
        model: 'togethercomputer/RedPajama-INCITE-Chat-3B-v1',
        prompt: `Is this message spam? Answer only yes or no: "${messageText}"`,
        max_tokens: 5,
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.output.text.toLowerCase().trim();
      return result.includes('yes');
    } catch (error) {
      logger.error('Together AI API error:', error);
      return false;
    }
  }

  async checkWithHuggingFace(messageText) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/unitary/toxic-bert',
        { inputs: messageText },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const toxicScore = response.data[0].find(item => item.label === 'TOXIC')?.score || 0;
      return toxicScore > 0.7;
    } catch (error) {
      logger.error('Hugging Face API error:', error);
      return false;
    }
  }

  calculateSimilarity(text1, text2) {
    // Simple Jaccard similarity
    const set1 = new Set(text1.toLowerCase().split(/\s+/));
    const set2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
}

module.exports = new AIService();