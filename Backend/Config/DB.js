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
}

const dbInstance = new Database();
module.exports = {
  connect: () => dbInstance.connect(),
};
