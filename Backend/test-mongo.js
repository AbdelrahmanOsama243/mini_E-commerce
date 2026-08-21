require('dotenv').config();
const mongoose = require('mongoose');

console.log("Attempting to connect to MongoDB using URI from .env...");

mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/Labs')
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

setTimeout(() => process.exit(0), 5000);
