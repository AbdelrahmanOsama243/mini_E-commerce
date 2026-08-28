const BaseRepo = require('./BaseRepo');
const PaymentMethod = require('../Models/PaymentMethod.Model');

class PaymentMethodRepo extends BaseRepo {
  constructor() {
    super(PaymentMethod);
  }

  /**
   * Find all saved payment methods for a specific user
   */
  async findByUserId(userId) {
    return await this.model.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Check if a user has any saved payment method (needed for COD check)
   */
  async hasAnyMethod(userId) {
    const count = await this.model.countDocuments({ userId });
    return count > 0;
  }

  /**
   * Create or update a payment method from Paymob transaction data
   */
  async createFromTransaction(userId, transactionData) {
    const { source_data } = transactionData;
    
    if (!source_data) return null;

    let type, paymobToken, lastFourDigits, cardBrand, walletPhone;

    if (source_data.type === 'card' && transactionData.token) {
      type = 'card';
      paymobToken = transactionData.token; // The saved token
      lastFourDigits = source_data.pan ? source_data.pan.slice(-4) : '';
      cardBrand = source_data.sub_type;
      
      // Prevent duplicates
      const existing = await this.model.findOne({ userId, paymobToken });
      if (existing) return existing;
      
    } else if (source_data.type === 'wallet' || source_data.sub_type === 'WALLET') {
      type = 'wallet';
      walletPhone = source_data.pan || source_data.identifier;
      
      // Prevent duplicates
      const existing = await this.model.findOne({ userId, walletPhone });
      if (existing) return existing;
    } else {
      return null; // Don't save kiosk or valu as methods
    }

    const isFirstMethod = !(await this.hasAnyMethod(userId));

    return await this.create({
      userId,
      type,
      paymobToken,
      lastFourDigits,
      cardBrand,
      walletPhone,
      isDefault: isFirstMethod
    });
  }
}

module.exports = new PaymentMethodRepo();
