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
const bcrypt = require("bcrypt");
const { connect, clean } = require("./Config/DB");

const User = require("./Models/User.Model");
const Product = require("./Models/Products.Model");
const Cart = require("./Models/Carts.Model");
const Order = require("./Models/orders.Model");

// ─── Seed Data ───────────────────────────────────────────────

const users = [
  {
    name: "Ali Hosam",
    email: "body55535@gmail.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "Admin User",
    email: "admin@ecommerce.com",
    password: "Admin@123",
    role: "admin",
  },
  {
    name: "John Doe",
    email: "john@example.com",
    password: "User@123",
    role: "user",
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    password: "User@123",
    role: "user",
  },
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "User@123",
    role: "user",
  },
  {
    name: "Bob Williams",
    email: "bob@example.com",
    password: "User@123",
    role: "user",
  },
];

const products = [
  {
    name: "Geometric Vase",
    description: "Matte black ceramic. Raw texture. Perfect for dry arrangements.",
    price: 120,
    category: "decor",
    stock: 50,
    image: "https://picsum.photos/seed/vase/600/600"
  },
  {
    name: "Industrial Lamp",
    description: "Minimalist industrial table lamp with exposed bulb.",
    price: 85,
    category: "lighting",
    stock: 120,
    image: "https://picsum.photos/seed/lamp/600/600"
  },
  {
    name: "Concrete Bookend",
    description: "Solid concrete bookend set. Architectural inspired design.",
    price: 45,
    category: "decor",
    stock: 200,
    image: "https://images.unsplash.com/photo-1683472698819-d069fc7c820d?w=600&q=80"
  },
  {
    name: "Linen Duvet Cover",
    description: "100% French flax linen duvet cover. Breathable and soft.",
    price: 150,
    category: "bedding",
    stock: 30,
    image: "https://images.unsplash.com/photo-1634665810235-011d663754e7?w=600&q=80"
  },
  {
    name: "Ceramic Dining Plates",
    description: "Set of 4 handcrafted ceramic dinner plates. Uneven edges.",
    price: 110,
    category: "dining",
    stock: 75,
    image: "https://images.unsplash.com/photo-1633856858940-42229cb53dd3?w=600&q=80"
  },
  {
    name: "Brass Pendant Light",
    description: "Mid-century modern brass pendant light fixture.",
    price: 240,
    category: "lighting",
    stock: 25,
    image: "https://images.unsplash.com/photo-1765282947675-2dd83fb46ebd?w=600&q=80"
  },
  {
    name: "Cotton Throw Blanket",
    description: "Woven cotton throw with fringe detail. Cozy and textured.",
    price: 65,
    category: "bedding",
    stock: 100,
    image: "https://images.unsplash.com/photo-1548536207-7b32566ca27d?w=600&q=80"
  },
  {
    name: "Wine Glass Set",
    description: "Set of 6 ribbed crystal wine glasses.",
    price: 80,
    category: "dining",
    stock: 80,
    image: "https://images.unsplash.com/photo-1594045713652-8a3d4cdec4c9?w=600&q=80"
  },
  {
    name: "Abstract Canvas Art",
    description: "Large monochromatic abstract canvas painting.",
    price: 350,
    category: "decor",
    stock: 10,
    image: "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?w=600&q=80"
  },
  {
    name: "Oak Dining Table",
    description: "Solid oak dining table with brutalist leg design. Seats 6.",
    price: 899,
    category: "dining",
    stock: 5,
    image: "https://images.unsplash.com/photo-1585128903994-9788298932a6?w=600&q=80"
  }
];

// ─── Seed Function ───────────────────────────────────────────

async function seed() {
  try {
    await connect();
    console.log("✅ Connected to database\n");

    // Clean existing data
    await clean();
    console.log("🗑️  Existing data cleared\n");

    // 1. Seed Users (hash passwords with bcrypt before inserting)
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 12),
      }))
    );
    const createdUsers = await User.create(usersWithHashedPasswords);
    console.log(`👤 ${createdUsers.length} users seeded`);

    // 2. Seed Products
    const createdProducts = await Product.create(products);
    console.log(`📦 ${createdProducts.length} products seeded`);

    // 3. Seed Carts (give each regular user a cart with some items)
    const regularUsers = createdUsers.filter((u) => u.role === "user");

    const carts = regularUsers.map((user, idx) => ({
      userId: user._id,
      items: [
        {
          productId: createdProducts[idx % createdProducts.length]._id,
          quantity: 2,
        },
        {
          productId: createdProducts[(idx + 1) % createdProducts.length]._id,
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
        productId: p._id,
        quantity: 1,
        priceAtPurchase: p.price,
      }));
      const totalPrice = items.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0
      );

      return {
        userId: user._id,
        items,
        totalPrice,
        status: idx === 0 ? "shipped" : "pending",
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
    console.log("   Admin  → body55535@gmail.com / Admin@123");
    console.log("   User   → john@example.com    / User@123");
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
