const mongoose = require("mongoose");
const logger = require("./logger");

class Database {
  #instance;
  async connect() {
    if (!this.#instance) {
      this.#instance = await mongoose
        .connect(process.env.DB_URI || "mongodb://localhost:27017/Labs")
        .then((conn) => {
          logger.info("Connected to MongoDB successfully");
          return conn;
        })
        .catch((err) => {
          logger.error({ err }, "Database connection failed");
          throw err;
        });
    }
    return this.#instance;
  }
}

const dbInstance = new Database();

// Graceful shutdown helper for MongoDB connection
const closeMongoDBConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully.");
  } catch (err) {
    logger.error({ err: err.message }, "Error closing MongoDB connection.");
  }
};

module.exports = {
  connect: () => dbInstance.connect(),
  closeMongoDBConnection,
};
