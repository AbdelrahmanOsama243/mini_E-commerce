const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['card', 'wallet'],
    required: true
  },
  // Paymob Token (for tokenized cards)
  paymobToken: String,
  // Last 4 digits of the card
  lastFourDigits: String,
  // Card brand (Visa/Mastercard)
  cardBrand: String,
  // Wallet phone number (masked)
  walletPhone: String,
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
