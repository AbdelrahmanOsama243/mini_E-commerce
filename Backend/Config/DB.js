const mongoose = require("mongoose");

class Database {
  #instance;
  async connect() {
    if (!this.#instance) {
      this.#instance = await mongoose
        .connect(process.env.DB_URI || "mongodb://localhost:27017/Labs")
        .then((conn) => {
          console.log("connect DB");
          return conn;
        })
        .catch((err) => console.log(err));
    }
    return this.#instance;
  }
  async clean() {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    console.log("Database cleaned successfully");
  }
}

const dbInstance = new Database();
module.exports = {
  connect: () => dbInstance.connect(),
  clean: () => dbInstance.clean(),
};
