const redis = require("redis");
const dotenv = require("dotenv");
const logger = require("./logger");

dotenv.config();
class Redis {
  #instance;
  constructor() {
    const clientConfig = {
      password: process.env.REDIS_SECRET,
      socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
      },
    };

    // Only use REDIS_URL if it's explicitly set in .env
    if (process.env.REDIS_URL) {
      clientConfig.url = process.env.REDIS_URL;
    }

    this.redisClient = redis.createClient(clientConfig);

    this.redisClient.on("error", (err) => {
      logger.warn({ err: err.message }, "Redis Client Error");
    });

    this.redisClient.on("connect", () => {
      logger.info("Connected to Redis successfully");
    });
  }
  async connectRedis() {
    try {
      if (this.#instance) return this.#instance;
      this.#instance = await this.redisClient.connect();
      return this.#instance;
    } catch (error) {
      logger.error({ err: error }, "Could not connect to Redis");
    }
  }
}
const redisInstance = new Redis();

// Graceful shutdown for standard Redis connection
const closeRedisConnection = async () => {
  try {
    if (redisInstance.redisClient && redisInstance.redisClient.isOpen) {
      await redisInstance.redisClient.quit();
      logger.info("Standard Redis connection closed gracefully.");
    }
  } catch (err) {
    logger.error({ err: err.message }, "Error closing Standard Redis connection.");
  }
};

process.on('SIGINT', async () => {
  await closeRedisConnection();
});

process.on('SIGTERM', async () => {
  await closeRedisConnection();
});

module.exports = {
  ...redisInstance,
  connectRedis: () => redisInstance.connectRedis(),
  redisClient: redisInstance.redisClient,
  closeRedisConnection
};
