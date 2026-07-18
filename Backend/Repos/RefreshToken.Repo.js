const BaseRepo = require('./BaseRepo');
const RefreshToken = require('../Models/RefreshToken.Model');

class RefreshTokenRepository extends BaseRepo {
  constructor() {
    super(RefreshToken);
    this.allowedUpdates = []; // Refresh tokens should never be updated, only created/deleted
  }

  async findByToken(token) {
    return await this.findOne({ token });
  }

  async deleteByToken(token) {
    return await this.model.findOneAndDelete({ token });
  }
  
  async deleteByUser(userId) {
    return await this.model.deleteMany({ user: userId });
  }
}

module.exports = new RefreshTokenRepository();
