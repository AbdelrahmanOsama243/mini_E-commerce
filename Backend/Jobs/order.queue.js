const { Queue } = require("bullmq");
const logger = require("../Config/logger");
const { createTrackedBullMQConnection } = require("../Config/ioredis");

const queueConnection = createTrackedBullMQConnection();

const orderQueue = new Queue("orderQueue", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true, // Keep DB clean after success
    removeOnFail: false, // Keep failed jobs for inspection
  },
});

/**
 * Add an order to the processing queue
 * @param {Object} orderData The order details
 */
const addOrderJob = async (orderData) => {
  try {
    const job = await orderQueue.add("process-order", orderData);
    logger.info({ jobId: job.id, orderId: orderData.orderId }, "Order job added to queue");
    return job;
  } catch (error) {
    logger.error({ err: error, orderId: orderData.orderId }, "Failed to add order job to queue");
    throw error;
  }
};

module.exports = { orderQueue, addOrderJob, queueConnection };
