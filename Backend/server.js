require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");
const { connect: connectDB, closeMongoDBConnection } = require("./Config/DB");
const { notFound, errorHandler } = require("./Middlewares/error.middleware");
//const { authentication } = require("./Middlewares/auth.middleware");
const sessionMiddleware = require("./Middlewares/session.middleware");
const redisInstance = require("./Config/Redis");
const logger = require("./Config/logger");
const { startEmailWorker, stopEmailWorker } = require("./Jobs/email.worker");
const { startOrderWorker, stopOrderWorker } = require("./Jobs/order.worker");

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Response compression
app.use(compression());

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:4200",
  process.env.MOBILE_URL || "http://localhost:8081",
  // add other origins here if needed
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like native mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// HTTP Request/Response Logging (replaces manual logger middleware)
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/" || req.url === "/favicon.ico",
  },
}));

const { globalLimiter, authLimiter } = require("./Middlewares/rateLimiter");

// Rate Limiting — Global
app.use(globalLimiter);

// Import Routes
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

// Routes
app.get("/", (req, res) => {
  res.send("Mini E-Commerce API is running...");
});

app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users/forget-password", authLimiter);

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Error Middleware (should be after all routes)
app.use(notFound);
app.use(errorHandler);

let server;

const initiate = async () => {
  try {
    // Database Connection
    await connectDB();
    await redisInstance.connectRedis();
    
    // Start background workers
    startEmailWorker();
    startOrderWorker();
    
    // Start server
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT||3000} in worker ${process.pid}`);
      logger.info(`http://127.0.0.1:${PORT||3000}`);
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to initiate server");
    process.exit(1);
  }
};

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop background workers first to prevent new jobs from processing
  await stopEmailWorker();
  await stopOrderWorker();

  // Close database connections gracefully
  await closeMongoDBConnection();
  await redisInstance.closeRedisConnection();

  if (server) {
    server.close(() => {
      logger.info("HTTP server closed");
    });
  }

  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
  } catch (err) {
    logger.error({ err }, "Error closing MongoDB connection");
  }

  try {
    if (redisInstance.redisClient && redisInstance.redisClient.isReady) {
      await redisInstance.redisClient.quit();
      logger.info("Redis connection closed");
    }
  } catch (err) {
    logger.error({ err }, "Error closing Redis connection");
  }

  try {
    await stopEmailWorker();
    logger.info("Email worker stopped");
  } catch (err) {
    logger.error({ err }, "Error stopping email worker");
  }

  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

initiate();

module.exports = app;