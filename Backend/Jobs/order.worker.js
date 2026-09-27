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

        // Restore cart items for the user so they don't lose their selections
        try {
          const failedOrder = await OrdersRepository.findById(orderId);
          if (failedOrder && failedOrder.items && failedOrder.items.length > 0) {
            const cartItems = failedOrder.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            }));
            const existingCart = await require("../Repos/Carts.Repo").getCartDocumentByUserId(failedOrder.userId);
            if (existingCart) {
              // Merge restored items back into cart
              const cartMap = new Map();
              existingCart.items.forEach(item => {
                cartMap.set(item.productId.toString(), item.quantity);
              });
              for (const item of cartItems) {
                const existingQty = cartMap.get(item.productId.toString()) || 0;
                cartMap.set(item.productId.toString(), existingQty + item.quantity);
              }
              const mergedItems = Array.from(cartMap, ([productId, quantity]) => ({
                _id: new (require("mongoose").Types.ObjectId)(),
                productId,
                quantity,
              }));
              await require("../Repos/Carts.Repo").updateCart(existingCart._id, mergedItems);
            } else {
              // Create new cart with restored items
              await require("../Repos/Carts.Repo").createCart(failedOrder.userId);
              const newCart = await require("../Repos/Carts.Repo").getCartDocumentByUserId(failedOrder.userId);
              const restoredItems = cartItems.map(item => ({
                _id: new (require("mongoose").Types.ObjectId)(),
                productId: item.productId,
                quantity: item.quantity,
              }));
              await require("../Repos/Carts.Repo").updateCart(newCart._id, restoredItems);
            }
            logger.info({ orderId }, "Cart restored after order failure");
          }
        } catch (restoreErr) {
          logger.error({ err: restoreErr.message, orderId }, "Failed to restore cart after order failure");
        }

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
