/**
 * Seed Script — Mini E-Commerce
 *
 * Usage:  node seed.js            (seeds the database)
 *         node seed.js --clean    (drops all collections first, then seeds)
 *
 * Requires DB_URI in .env (falls back to mongodb://localhost:27017/Labs)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { connect, clean } = require("./Config/DB");

const User = require("./Models/User.Model");
const Product = require("./Models/Products.Model");
const Cart = require("./Models/Carts.Model");
const Order = require("./Models/orders.Model");

// ─── Seed Data ───────────────────────────────────────────────

const users = [
  {
    name: "Admin User",
    email: "admin@ecommerce.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    password: "User@123",
    role: "user",
  },
  {
    name: "Sara Mohamed",
    email: "sara@example.com",
    password: "User@123",
    role: "user",
  },
  {
    name: "Omar Ali",
    email: "omar@example.com",
    password: "User@123",
    role: "user",
  },
];

const products = [
  {
    name: "Wireless Bluetooth Headphones",
    description:
      "Premium noise-cancelling wireless headphones with 30-hour battery life.",
    price: 299.99,
    category: "Electronics",
    stock: 50,
    images: [
      "https://placehold.co/600x400?text=Headphones+Front",
      "https://placehold.co/600x400?text=Headphones+Side",
    ],
  },
  {
    name: "Mechanical Gaming Keyboard",
    description:
      "RGB backlit mechanical keyboard with Cherry MX Blue switches.",
    price: 149.99,
    category: "Electronics",
    stock: 120,
    images: ["https://placehold.co/600x400?text=Keyboard"],
  },
  {
    name: "Running Shoes Pro",
    description: "Lightweight running shoes with responsive cushioning.",
    price: 89.99,
    category: "Sports",
    stock: 200,
    images: [
      "https://placehold.co/600x400?text=Shoes+Front",
      "https://placehold.co/600x400?text=Shoes+Back",
    ],
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Double-wall insulated water bottle — keeps drinks cold 24h.",
    price: 24.99,
    category: "Accessories",
    stock: 300,
    images: ["https://placehold.co/600x400?text=Bottle"],
  },
  {
    name: "Leather Laptop Bag",
    description: "Genuine leather laptop bag fits up to 15.6-inch laptops.",
    price: 199.99,
    category: "Accessories",
    stock: 75,
    images: [
      "https://placehold.co/600x400?text=Bag+Front",
      "https://placehold.co/600x400?text=Bag+Open",
    ],
  },
  {
    name: "Smart Watch Series X",
    description:
      "Health and fitness tracking smartwatch with AMOLED display.",
    price: 349.99,
    category: "Electronics",
    stock: 60,
    images: ["https://placehold.co/600x400?text=SmartWatch"],
  },
  {
    name: "Organic Green Tea (50 Bags)",
    description: "Premium Japanese organic green tea bags.",
    price: 12.99,
    category: "Food",
    stock: 500,
    images: ["https://placehold.co/600x400?text=GreenTea"],
  },
  {
    name: "Yoga Mat Premium",
    description: "Non-slip 6mm thick yoga mat with carrying strap.",
    price: 39.99,
    category: "Sports",
    stock: 150,
    images: ["https://placehold.co/600x400?text=YogaMat"],
  },
];

// ─── Seed Function ───────────────────────────────────────────

async function seed() {
  try {
    await connect();
    console.log("✅ Connected to database\n");

    // Optional: clean existing data
    if (process.argv.includes("--clean")) {
      await clean();
      console.log("🗑️  Existing data cleared\n");
    }

    // 1. Seed Users (passwords are auto-hashed by the pre-save hook)
    const createdUsers = await User.create(users);
    console.log(`👤 ${createdUsers.length} users seeded`);

    // 2. Seed Products
    const createdProducts = await Product.create(products);
    console.log(`📦 ${createdProducts.length} products seeded`);

    // 3. Seed Carts (give each regular user a cart with some items)
    const regularUsers = createdUsers.filter((u) => u.role === "user");

    const carts = regularUsers.map((user, idx) => ({
      user: user._id,
      items: [
        {
          product: createdProducts[idx % createdProducts.length]._id,
          quantity: 2,
        },
        {
          product:
            createdProducts[(idx + 1) % createdProducts.length]._id,
          quantity: 1,
        },
      ],
    }));

    const createdCarts = await Cart.create(carts);
    console.log(`🛒 ${createdCarts.length} carts seeded`);

    // 4. Seed Orders (create an order for the first two regular users)
    const orders = regularUsers.slice(0, 2).map((user, idx) => {
      const orderedProducts = [
        createdProducts[idx % createdProducts.length],
        createdProducts[(idx + 2) % createdProducts.length],
      ];
      const items = orderedProducts.map((p) => ({
        product: p._id,
        quantity: 1,
        priceAtPurchase: p.price,
      }));
      const totalPrice = items.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      return {
        user: user._id,
        items,
        totalPrice,
        status: idx === 0 ? "paid" : "pending",
        shippingAddress: `${123 + idx} Example Street, Cairo, Egypt`,
      };
    });

    const createdOrders = await Order.create(orders);
    console.log(`📋 ${createdOrders.length} orders seeded`);

    // ─── Summary ─────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  🌱 Seeding completed successfully!");
    console.log("════════════════════════════════════════");
    console.log("\n📌 Test Credentials:");
    console.log("   Admin  → admin@ecommerce.com / Admin@123");
    console.log("   User   → ahmed@example.com   / User@123");
    console.log("");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
}

seed();
