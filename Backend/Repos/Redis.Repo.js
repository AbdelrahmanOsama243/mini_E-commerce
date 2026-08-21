const redisInstance = require("../Config/Redis");
const logger = require("../Config/logger");

class RedisRepo {
  constructor() {
    this.client = redisInstance.redisClient;
  }

  async get(key) {
    try {
      if (!this.client || !this.client.isReady) return null;
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      logger.warn({ key }, "Redis unavailable — skipped GET");
      return null;
    }
  }

  async set(key, value, expiresInSeconds = null) {
    try {
      if (!this.client || !this.client.isReady) return;
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (expiresInSeconds) {
        await this.client.setEx(key, expiresInSeconds, valueToStore);
      } else {
        await this.client.set(key, valueToStore);
      }
    } catch (error) {
      logger.warn({ key }, "Redis unavailable — skipped SET");
    }
  }

  async delete(key) {
    try {
      if (!this.client || !this.client.isReady) return;
      await this.client.del(key);
    } catch (error) {
      logger.warn({ key }, "Redis unavailable — skipped DEL");
    }
  }

  async deleteByPattern(pattern) {
    try {
      if (!this.client || !this.client.isReady) return;
      const keys = [];
      for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        keys.push(key);
      }
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.warn({ pattern }, "Redis unavailable — skipped pattern DEL");
    }
  }

  async exists(key) {
    try {
      if (!this.client || !this.client.isReady) return false;
      return await this.client.exists(key);
    } catch (error) {
      logger.warn({ key }, "Redis unavailable — skipped EXISTS");
      return false;
    }
  }

  async clearAll() {
    try {
      if (!this.client || !this.client.isReady) return;
      await this.client.flushAll();
    } catch (error) {
      logger.warn("Redis unavailable — skipped FLUSH");
    }
  }
}

module.exports = new RedisRepo();
