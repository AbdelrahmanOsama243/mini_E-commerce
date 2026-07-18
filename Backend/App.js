require("dotenv").config();
const express = require("express");
const { connect } = require("./Config/DB");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Import Auth Middleware
const { protect } = require("./Middlewares/auth.middleware");

// Routes
app.get("/", (req, res) => {
  res.send("Mini E-Commerce API is running...");
});

// Test Protected Route
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "You have access to this protected route!", user: req.user });
});

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
      console.log(`Server is running on port ${PORT}`);
      console.log(`http://127.0.0.1:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to initiate server:", error);
    process.exit(1);
  }
};

initiate();

