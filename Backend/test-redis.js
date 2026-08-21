require('dotenv').config();
const redis = require('redis');

console.log("Attempting to connect to Redis using settings from .env...");

const client = redis.createClient({
  password: process.env.REDIS_SECRET,
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  },
  url: process.env.REDIS_URL || "redis://default:LphCcXfIV7mvurvwCNAacoIeE5H7aqKV@cathartic-willowy-emerald-30373.db.redis.io:17611",
});

client.on('error', err => console.log('❌ Redis Event Error:', err.message));

client.connect()
  .then(() => console.log('✅ Redis Connected Successfully'))
  .catch(err => console.log('❌ Redis Connect Catch:', err.message));

setTimeout(() => process.exit(0), 3000);
