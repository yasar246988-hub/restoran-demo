const redis = require('redis');
const config = require('../config');
const { logger } = require('../middlewares/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Redis connection failed:', error);
      this.isConnected = false;
    }
  }

  async set(key, value, expiration = 3600) {
    if (!this.isConnected) return null;

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, expiration, stringValue);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  async increment(key, expiration = 3600) {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.incr(key);
      if (value === 1) {
        await this.client.expire(key, expiration);
      }
      return value;
    } catch (error) {
      logger.error('Redis increment error:', error);
      return null;
    }
  }

  disconnect() {
    if (this.client) {
      this.client.quit();
    }
  }
}

module.exports = new RedisService(); 