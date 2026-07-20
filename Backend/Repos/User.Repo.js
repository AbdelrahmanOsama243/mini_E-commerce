const BaseRepo = require("./BaseRepo");
const User = require("../Models/User.Model");
const bcrypt = require("bcrypt");

class UserRepository extends BaseRepo {
  constructor() {
    super(User);
    this.allowedUpdates = ['name', 'email'];
  }

  async registerUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    return await this.create({ ...userData, password: hashedPassword });
  }

  async comparePassword(plainText, hashedPassword) {
    return await bcrypt.compare(plainText, hashedPassword);
  }
  
  async findUserByEmail(email) {
    return await this.findOne({ email });
  }

  async findUserById(id) {
    return await this.findById(id, { select: "-password" });
  }
}

module.exports = new UserRepository();
