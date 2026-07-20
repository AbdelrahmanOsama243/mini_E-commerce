const BaseRepo = require('./BaseRepo');
const RefreshToken = require('../Models/RefreshToken.Model');
const crypto = require('crypto');

class RefreshTokenRepository extends BaseRepo {
  constructor() {
    super(RefreshToken);
    this.allowedUpdates = []; // Refresh tokens should never be updated, only created/deleted
  }

  _hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create(data, options = {}) {
    if (data && data.token) {
      data = { ...data, token: this._hashToken(data.token) };
    }
    return await super.create(data, options);
  }

  async findByToken(token) {
    const hashedToken = this._hashToken(token);
    return await this.findOne({ token: hashedToken });
  }

  async deleteByToken(token) {
    const hashedToken = this._hashToken(token);
    return await this.model.findOneAndDelete({ token: hashedToken });
  }
  
  async deleteByUser(userId) {
    return await this.model.deleteMany({ user: userId });
  }
}

module.exports = new RefreshTokenRepository();
