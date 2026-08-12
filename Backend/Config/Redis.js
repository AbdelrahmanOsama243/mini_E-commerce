const redis = require("redis");
const dotenv = require("dotenv");

dotenv.config();
class Redis {
  #instance;
  constructor() {
    this.client = redis.createClient({
      password: process.env.REDIS_SECRET,
      socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Connected to Redis successfully!");
    });

    connectRedis = async () => {
      try {
        if (this.#instance) return this.#instance;
        this.#instance = await redisClient.connect();
      } catch (error) {
        console.error("Could not connect to Redis:", error);
      }
    };
  }
}
const redisInstance = new Redis();
module.exports = redisInstance;
