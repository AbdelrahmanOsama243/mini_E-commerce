const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be a positive number']
    },
    category: {
      type: String,
      required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock must be a positive number']
    },
    image: {
        type: String,
        // Accepts both URLs and local file paths (e.g., /uploads/products/product-123.jpg)
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);