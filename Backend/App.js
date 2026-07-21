require("dotenv").config();
const express = require("express");
const { connect } = require("./Config/DB");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Enable CORS for Angular frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Import Route Handlers
const authRoutes = require("./Routes/auth.routes");
const productRoutes = require("./Routes/product.routes");
const cartRoutes = require("./Routes/cart.routes");
const orderRoutes = require("./Routes/order.routes");

// API Routes
app.get("/", (req, res) => {
  res.json({ message: "Mini E-Commerce API is running..." });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Import Error Middleware
const { notFound, errorHandler } = require("./Middlewares/error.middleware");

// Error Middleware (must be after all routes)
app.use(notFound);
app.use(errorHandler);

const initiate = async () => {
  try {
    // Database Connection
    await connect();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`http://127.0.0.1:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initiate server:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  initiate();
}

module.exports = app;
