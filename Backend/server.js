require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { connect } = require("./Config/DB");
const { notFound, errorHandler } = require("./Middlewares/error.middleware");
const { authentication } = require("./Middlewares/auth.middleware");
const sessionMiddleware = require("./Middlewares/session.middleware");



const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Middleware
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);
app.use(authentication);

// Import Routes
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

// Routes
app.get("/", (req, res) => {
  res.send("Mini E-Commerce API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Error Middleware (should be after all routes)
app.use(notFound);
app.use(errorHandler);

const initiate = async () => {
  try {
    // Database Connection
    await connect();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT||3000} in worker ${process.pid}`);
      console.log(`http://127.0.0.1:${process.env.PORT||3000}`);
    });
  } catch (error) {
    console.error("Failed to initiate server:", error);
    process.exit(1);
  }
};

initiate();

module.exports = app;