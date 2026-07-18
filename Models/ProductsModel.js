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
          match: [/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/,
                 'Please enter a valid URL',
                 ],
    }
  },
  {
    timestamps: true
  }
);