const Redis = require('ioredis');
const logger = require('./logger');
require('dotenv').config();

/**
 * دالة مصنع (Factory Function) لإنشاء اتصال جديد لـ BullMQ
 * نستدعي هذه الدالة في كل مرة نحتاج فيها لـ Queue أو Worker منفصل
 */
const createBullMQConnection = () => {
  let connectionConfig;

  if (process.env.REDIS_URL) {
    connectionConfig = process.env.REDIS_URL;
  } else {
    connectionConfig = {
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_SECRET || undefined,
    };
  }

  // maxRetriesPerRequest: null is extremely important for BullMQ
  const connection = new Redis(connectionConfig, {
    maxRetriesPerRequest: null,
  });

  // مراقبة الأخطاء (مثل فقدان الاتصال بلحظة)
  connection.on('error', (err) => {
    logger.warn({ err: err.message }, 'BullMQ Redis Connection Warning');
  });

  // مراقبة إعادة الاتصال
  connection.on('reconnecting', () => {
    logger.info('BullMQ Redis is attempting to reconnect...');
  });

  return connection;
};

// ==========================================
// إعداد الـ Graceful Shutdown لـ PM2
// ==========================================
// نحتفظ بقائمة بالاتصالات المفتوحة لنغلقها معاً عند الإيقاف
const activeConnections = new Set();

const createTrackedBullMQConnection = () => {
  const connection = createBullMQConnection();
  activeConnections.add(connection);
  return connection;
};

const closeAllBullMQConnections = async () => {
  logger.info('PM2 Shutdown Signal: Closing all BullMQ Redis connections...');
  const promises = [];
  for (const conn of activeConnections) {
    if (conn.status === 'ready') {
      promises.push(conn.quit());
    }
  }
  await Promise.all(promises);
  logger.info('All BullMQ connections closed gracefully.');
};

// Hook into the process exit events to ensure graceful shutdown of BullMQ connections
process.on('SIGINT', async () => {
  await closeAllBullMQConnections();
});

process.on('SIGTERM', async () => {
  await closeAllBullMQConnections();
});

// نصدر الدالة التي تتبع الاتصالات
module.exports = { createTrackedBullMQConnection, closeAllBullMQConnections };
