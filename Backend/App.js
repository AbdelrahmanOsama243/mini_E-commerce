require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { connect } = require("./Config/DB");

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Middleware
app.use(cors());
app.use(express.json());

// Import Auth Middleware
const { authentication } = require("./Middlewares/auth.middleware");

// Import Routes
const userRoutes = require("./Routes/user.routes");
const productRoutes = require("./Routes/product.routes");
const cartRoutes = require("./Routes/cart.routes");
const orderRoutes = require("./Routes/order.routes");

// Routes
app.get("/", (req, res) => {
  res.send("Mini E-Commerce API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Import Error Middleware
const { notFound, errorHandler } = require("./Middlewares/error.middleware");

// Error Middleware (should be after all routes)
app.use(notFound);
app.use(errorHandler);

const initiate = async () => {
  try {
    // Database Connection
    await connect();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT||3000}`);
      console.log(`http://127.0.0.1:${process.env.PORT||3000}`);
    });
  } catch (error) {
    console.error("Failed to initiate server:", error);
    process.exit(1);
  }
};

initiate();

