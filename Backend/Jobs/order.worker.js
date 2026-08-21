const { Worker } = require("bullmq");
const logger = require("../Config/logger");
const { createTrackedBullMQConnection } = require("../Config/ioredis");
const ProductsRepository = require("../Repos/Products.Repo");
const OrdersRepository = require("../Repos/orders.Repo");

let orderWorker;

const startOrderWorker = () => {
  orderWorker = new Worker(
    "orderQueue",
    async (job) => {
      const { orderId, cartItems } = job.data;
      logger.info({ jobId: job.id, orderId }, "Processing order job");

      try {
        // Validate and Deduct stock atomically
        for (const item of cartItems) {
          // decrementStock checks if stock >= quantity before decrementing
          const updatedProduct = await ProductsRepository.decrementStock(item.productId, item.quantity);
          if (!updatedProduct) {
            // Stock insufficient or product missing
            throw new Error(`Insufficient stock for product ID: ${item.productId}`);
          }
        }

        // If we reach here, stock deduction was successful for all items
        // Update order status to 'processing'
        await OrdersRepository.update(orderId, { status: "processing" });
        logger.info({ orderId }, "Order processed successfully and marked as processing");

      } catch (error) {
        logger.error({ err: error.message, orderId }, "Order processing failed (stock issue)");
        // Update order status to 'failed' since stock was not sufficient
        await OrdersRepository.update(orderId, { status: "failed" });
        // Throwing error marks the job as failed in BullMQ
        throw error; 
      }
    },
    {
      connection: createTrackedBullMQConnection(),
      concurrency: 5, // Process 5 orders concurrently
    }
  );

  // Event listeners
  orderWorker.on("completed", (job) => {
    logger.info({ jobId: job.id, orderId: job.data.orderId }, "Order job completed successfully");
  });

  orderWorker.on("failed", (job, err) => {
    logger.error(
      { jobId: job?.id, orderId: job?.data?.orderId, err: err.message, attempts: job?.attemptsMade },
      "Order job failed"
    );
  });

  orderWorker.on("error", (err) => {
    logger.warn({ err: err.message }, "Order worker connection error");
  });

  logger.info("Order worker started and listening for jobs");

  return orderWorker;
};

const stopOrderWorker = async () => {
  if (orderWorker) {
    await orderWorker.close();
    logger.info("Order worker stopped");
  }
};

module.exports = { startOrderWorker, stopOrderWorker };
