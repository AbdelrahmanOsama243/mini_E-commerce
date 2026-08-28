const Redis = require('ioredis');
const logger = require('./logger');
require('dotenv').config();

/**
 * دالة مصنع (Factory Function) لإنشاء اتصال جديد لـ BullMQ
 * نستدعي هذه الدالة في كل مرة نحتاج فيها لـ Queue أو Worker منفصل
 */
const createBullMQConnection = () => {
  let connection;

  if (process.env.REDIS_URL) {
    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  } else {
    connection = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_SECRET || undefined,
      maxRetriesPerRequest: null,
    });
  }

  // Monitor errors
  connection.on('error', (err) => {
    logger.warn({ err: err.message }, 'BullMQ Redis Connection Warning');
  });

  // Monitor reconnecting
  connection.on('reconnecting', () => {
    logger.info('BullMQ Redis is attempting to reconnect...');
  });

  return connection;
};

// ==========================================
// Graceful Shutdown Tracking for BullMQ
// ==========================================
const activeConnections = new Set();

const createTrackedBullMQConnection = () => {
  const connection = createBullMQConnection();
  activeConnections.add(connection);
  return connection;
};

const closeAllBullMQConnections = async () => {
  logger.info('Closing all BullMQ Redis connections...');
  const promises = [];
  for (const conn of activeConnections) {
    if (conn.status === 'ready') {
      promises.push(conn.quit().catch((e) => logger.warn({ err: e.message }, 'Error closing BullMQ connection')));
    }
  }
  await Promise.all(promises);
  activeConnections.clear();
  logger.info('All BullMQ connections closed.');
};

module.exports = { createTrackedBullMQConnection, closeAllBullMQConnections };
