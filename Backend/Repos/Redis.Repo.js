const redisInstance = require("../Config/Redis");

class RedisRepo {
  constructor() {
    this.client = redisInstance.client;
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    } catch (error) {
      console.error(`Error getting key ${key} from Redis:`, error);
      throw error;
    }
  }

  async set(key, value, expiresInSeconds = null) {
    try {
      const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (expiresInSeconds) {
        await this.client.setEx(key, expiresInSeconds, valueToStore);
      } else {
        await this.client.set(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error);
      throw error;
    }
  }

  async delete(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error);
      throw error;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error(`Error checking existence of key ${key} in Redis:`, error);
      throw error;
    }
  }

  async clearAll() {
    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Error flushing Redis DB:', error);
      throw error;
    }
  }
}

module.exports = new RedisRepo();
