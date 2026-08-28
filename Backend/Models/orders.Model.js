const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1']
        },
        priceAtPurchase: {
          type: Number,
          required: true,
          min: [0, 'Price at purchase must be a positive number']
        }
      }
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price must be a positive number']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'payment_failed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    shippingAddress: {
      type: String,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'kiosk', 'valu', 'cod'],
      required: true,
      default: 'cod'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    paymobOrderId: {
      type: Number
    },
    transactionId: {
      type: String
    },
    refundedAmount: {
      type: Number,
      default: 0
    },
    fawryRef: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);