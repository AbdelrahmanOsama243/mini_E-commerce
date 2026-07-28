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
  // 1. decor
  {
    name: "Geometric Vase",
    description: "Matte black ceramic. Raw texture. Perfect for dry arrangements.",
    price: 120,
    category: "decor",
    stock: 50,
    image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&q=80"
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
    name: "Abstract Canvas Art",
    description: "Large monochromatic abstract canvas painting.",
    price: 350,
    category: "decor",
    stock: 10,
    image: "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?w=600&q=80"
  },
  {
    name: "Terrazzo Plant Pot",
    description: "Hand-poured terrazzo ceramic pot with matching drainage tray.",
    price: 55,
    category: "decor",
    stock: 80,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80"
  },
  {
    name: "Minimalist Wall Clock",
    description: "Brutalist matte steel wall clock with silent sweeping quartz movement.",
    price: 95,
    category: "decor",
    stock: 60,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&q=80"
  },

  // 2. lighting
  {
    name: "Industrial Lamp",
    description: "Minimalist industrial table lamp with exposed bulb.",
    price: 85,
    category: "lighting",
    stock: 120,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80"
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
    name: "Ceramic Floor Lamp",
    description: "Tall textured ceramic floor lamp with warm linen shade.",
    price: 310,
    category: "lighting",
    stock: 15,
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80"
  },
  {
    name: "Opal Glass Sconce",
    description: "Wall-mounted opal glass orb sconce with blackened brass accent.",
    price: 130,
    category: "lighting",
    stock: 40,
    image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=600&q=80"
  },
  {
    name: "LED Desk Lamp",
    description: "Ultra-slim matte black aluminum desk lamp with adjustable color temperature.",
    price: 75,
    category: "lighting",
    stock: 90,
    image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=600&q=80"
  },

  // 3. bedding
  {
    name: "Linen Duvet Cover",
    description: "100% French flax linen duvet cover. Breathable and soft.",
    price: 150,
    category: "bedding",
    stock: 30,
    image: "https://images.unsplash.com/photo-1634665810235-011d663754e7?w=600&q=80"
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
    name: "Silk Pillowcase Set",
    description: "Set of 2 pure mulberry silk pillowcases. Gentle on skin and hair.",
    price: 85,
    category: "bedding",
    stock: 70,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80"
  },
  {
    name: "Weighted Blanket",
    description: "15lb organic cotton weighted blanket with glass bead filling.",
    price: 180,
    category: "bedding",
    stock: 20,
    image: "https://images.unsplash.com/photo-1578898887932-dce23a595ad4?w=600&q=80"
  },
  {
    name: "Bamboo Fitted Sheet",
    description: "Cooling bamboo viscose fitted sheet with deep pockets.",
    price: 110,
    category: "bedding",
    stock: 50,
    image: "https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600&q=80"
  },

  // 4. dining
  {
    name: "Ceramic Dining Plates",
    description: "Set of 4 handcrafted ceramic dinner plates. Uneven edges.",
    price: 110,
    category: "dining",
    stock: 75,
    image: "https://images.unsplash.com/photo-1633856858940-42229cb53dd3?w=600&q=80"
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
    name: "Oak Dining Table",
    description: "Solid oak dining table with brutalist leg design. Seats 6.",
    price: 899,
    category: "dining",
    stock: 5,
    image: "https://images.unsplash.com/photo-1585128903994-9788298932a6?w=600&q=80"
  },
  {
    name: "Stainless Steel Cutlery Set",
    description: "24-piece matte black stainless steel flatware set.",
    price: 95,
    category: "dining",
    stock: 65,
    image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80"
  },
  {
    name: "Marble Serving Tray",
    description: "Solid white Carrara marble serving platter with brass handles.",
    price: 70,
    category: "dining",
    stock: 45,
    image: "https://images.unsplash.com/photo-1615800098779-1be32e60cca3?w=600&q=80"
  },

  // 5. furniture
  {
    name: "Velvet Lounge Chair",
    description: "Deep-seated lounge chair upholstered in rich forest green velvet.",
    price: 450,
    category: "furniture",
    stock: 12,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80"
  },
  {
    name: "Minimalist Coffee Table",
    description: "Low-profile ebonized ash coffee table with architectural geometry.",
    price: 280,
    category: "furniture",
    stock: 18,
    image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=600&q=80"
  },
  {
    name: "Solid Wood Bookshelf",
    description: "5-tier open modular bookshelf made from sustainably sourced walnut.",
    price: 520,
    category: "furniture",
    stock: 8,
    image: "https://images.unsplash.com/photo-1594683515159-8ff7a18bb1fc?w=600&q=80"
  },
  {
    name: "Ergonomic Office Chair",
    description: "Minimalist task chair with breathable mesh back and lumbar support.",
    price: 350,
    category: "furniture",
    stock: 25,
    image: "https://images.unsplash.com/photo-1580481077494-e3299ac2fef6?w=600&q=80"
  },
  {
    name: "Modern Sideboard",
    description: "Spacious storage sideboard with slatted wood sliding doors.",
    price: 650,
    category: "furniture",
    stock: 6,
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80"
  },

  // 6. kitchen
  {
    name: "Cast Iron Skillet",
    description: "12-inch pre-seasoned heavy cast iron skillet for superior heat retention.",
    price: 90,
    category: "kitchen",
    stock: 55,
    image: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&q=80"
  },
  {
    name: "Chef Knife Set",
    description: "3-piece Japanese steel kitchen knife set with magnetic wooden stand.",
    price: 160,
    category: "kitchen",
    stock: 40,
    image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&q=80"
  },
  {
    name: "Acacia Wood Cutting Board",
    description: "End-grain acacia wood butcher block with juice groove.",
    price: 50,
    category: "kitchen",
    stock: 110,
    image: "https://images.unsplash.com/photo-1594998893017-361470bd9dcf?w=600&q=80"
  },
  {
    name: "Espresso Maker",
    description: "Compact stainless steel espresso machine with 15-bar pump and steam wand.",
    price: 420,
    category: "kitchen",
    stock: 15,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80"
  },
  {
    name: "Ceramic Canister Set",
    description: "Set of 3 airtight stoneware storage canisters with bamboo lids.",
    price: 65,
    category: "kitchen",
    stock: 85,
    image: "https://images.unsplash.com/photo-1584473457406-6240486418e9?w=600&q=80"
  },

  // 7. storage
  {
    name: "Woven Storage Baskets",
    description: "Set of 3 natural seagrass baskets with sturdy integrated handles.",
    price: 55,
    category: "storage",
    stock: 95,
    image: "https://images.unsplash.com/photo-1591129841117-3adfd313e34f?w=600&q=80"
  },
  {
    name: "Wire Wall Grid",
    description: "Matte black geometric wall grid organizer with clips and hooks.",
    price: 35,
    category: "storage",
    stock: 150,
    image: "https://images.unsplash.com/photo-1507842229356-51ce99729218?w=600&q=80"
  },
  {
    name: "Modular Organizers",
    description: "Stackable felt storage trays for desk and drawer organization.",
    price: 45,
    category: "storage",
    stock: 120,
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80"
  },
  {
    name: "Under-bed Storage Box",
    description: "Low-profile canvas storage container with smooth rolling casters.",
    price: 60,
    category: "storage",
    stock: 70,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80"
  },
  {
    name: "Leather Magazine Holder",
    description: "Structured saddle leather rack with black iron frame.",
    price: 80,
    category: "storage",
    stock: 40,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80"
  },

  // 8. bath
  {
    name: "Waffle Knit Towel Set",
    description: "Ultra-absorbent waffle knit organic cotton bath towel set.",
    price: 90,
    category: "bath",
    stock: 60,
    image: "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600&q=80"
  },
  {
    name: "Stone Bath Mat",
    description: "Quick-drying diatomaceous earth stone bath mat. Naturally antimicrobial.",
    price: 65,
    category: "bath",
    stock: 80,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80"
  },
  {
    name: "Glass Dispenser Set",
    description: "Amber glass soap and lotion dispenser bottles with matte black pumps.",
    price: 40,
    category: "bath",
    stock: 100,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80"
  },
  {
    name: "Bamboo Bathtub Caddy",
    description: "Expandable water-resistant bamboo tray with book and wine glass holder.",
    price: 55,
    category: "bath",
    stock: 50,
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=80"
  },
  {
    name: "Plush Bathrobe",
    description: "Heavyweight Turkish cotton bathrobe with shawl collar and deep pockets.",
    price: 110,
    category: "bath",
    stock: 35,
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80"
  },

  // 9. textiles
  {
    name: "Handwoven Area Rug",
    description: "5x8ft wool blend architectural pattern rug in neutral tones.",
    price: 380,
    category: "textiles",
    stock: 10,
    image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=600&q=80"
  },
  {
    name: "Velvet Cushion Cover",
    description: "20x20 inch heavy cotton velvet pillow cover with hidden zipper.",
    price: 35,
    category: "textiles",
    stock: 140,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&q=80"
  },
  {
    name: "Linen Table Runner",
    description: "Rustic washed linen dining table runner with fringed edges.",
    price: 45,
    category: "textiles",
    stock: 90,
    image: "https://images.unsplash.com/photo-1578496479914-7ef3b0193be3?w=600&q=80"
  },
  {
    name: "Jute Floor Mat",
    description: "Natural braided jute entryway mat. Highly durable and textured.",
    price: 75,
    category: "textiles",
    stock: 45,
    image: "https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=600&q=80"
  },
  {
    name: "Cotton Blackout Curtains",
    description: "Set of 2 heavy cotton drape panels with thermal blackout lining.",
    price: 130,
    category: "textiles",
    stock: 30,
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80"
  },

  // 10. accessories
  {
    name: "Brass Candle Holders",
    description: "Set of 3 machined solid brass taper candle holders of varying heights.",
    price: 45,
    category: "accessories",
    stock: 110,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&q=80"
  },
  {
    name: "Ceramic Incense Burner",
    description: "Minimalist ash-catcher ceramic tray for stick and cone incense.",
    price: 30,
    category: "accessories",
    stock: 150,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80"
  },
  {
    name: "Decorative Book Box",
    description: "Linen-wrapped storage box disguised as a classic hardcover art book.",
    price: 40,
    category: "accessories",
    stock: 85,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80"
  },
  {
    name: "Modern Arch Mirror",
    description: "Tabletop or wall-mounted brass framed arch vanity mirror.",
    price: 180,
    category: "accessories",
    stock: 20,
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80"
  },
  {
    name: "Sculptural Paperweight",
    description: "Solid cast bronze geometric knot object for desk styling.",
    price: 25,
    category: "accessories",
    stock: 200,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80"
  },

  // 11. gaming
  {
    name: "Mechanical Gaming Keyboard",
    description: "RGB customized mechanical keyboard with tactile switches and aluminum frame.",
    price: 140,
    category: "gaming",
    stock: 45,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80"
  },
  {
    name: "Wireless Gaming Mouse",
    description: "Ultra-lightweight ergonomic wireless gaming mouse with 25k DPI sensor.",
    price: 80,
    category: "gaming",
    stock: 60,
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80"
  },
  {
    name: "Pro Gaming Headset",
    description: "7.1 surround sound wired headset with detachable noise-canceling microphone.",
    price: 120,
    category: "gaming",
    stock: 50,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80"
  },
  {
    name: "Ergonomic Gaming Monitor",
    description: "27-inch 165Hz QHD IPS display with HDR support and ultra-slim bezel.",
    price: 350,
    category: "gaming",
    stock: 20,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80"
  },
  {
    name: "RGB Desk Mouse Pad",
    description: "Extended micro-woven cloth gaming desk mat with customizable RGB lighting.",
    price: 30,
    category: "gaming",
    stock: 100,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80"
  },

  // 12. electronics
  {
    name: "Noise-Canceling Headphones",
    description: "Premium over-ear wireless headphones with industry-leading ANC and 30hr battery.",
    price: 250,
    category: "electronics",
    stock: 35,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Rugged waterproof 360-degree portable speaker with deep bass.",
    price: 95,
    category: "electronics",
    stock: 75,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80"
  },
  {
    name: "Fast Wireless Charger",
    description: "15W magnetic wireless charging pad with machined aluminum base.",
    price: 45,
    category: "electronics",
    stock: 120,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80"
  },
  {
    name: "4K Streaming Media Player",
    description: "Compact 4K HDR streaming dongle with voice control remote.",
    price: 60,
    category: "electronics",
    stock: 90,
    image: "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600&q=80"
  },
  {
    name: "High-Capacity Power Bank",
    description: "20,000mAh portable battery pack with 65W USB-C fast charging.",
    price: 50,
    category: "electronics",
    stock: 110,
    image: "https://images.unsplash.com/photo-1609592424209-27d4c2b8c9d1?w=600&q=80"
  }
];

// ─── Seed Function ───────────────────────────────────────────

async function seed() {
  try {
    await connect();
    console.log("✅ Connected to database\n");



    // 1. Seed Users (التحديث أو الإدخال الآمن للمستخدمين)
    console.log("⏳ Seeding Users...");
    const upsertedUsers = [];
    for (const u of users) {
      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(u.password, 12);
      
      // البحث بالبريد الإلكتروني، وإذا لم يوجد ننشئه، وإذا وجد نحدثه
      const user = await User.findOneAndUpdate(
        { email: u.email }, 
        { $set: { ...u, password: hashedPassword } },
        { upsert: true, new: true } 
      );
      upsertedUsers.push(user);
    }
    console.log(`👤 ${upsertedUsers.length} users verified and safely upserted`);

    // 2. Seed Products (التحديث أو الإدخال الآمن للمنتجات)
    console.log("⏳ Seeding Products...");
    const upsertedProducts = [];
    for (const p of products) {
      // البحث باسم المنتج لضمان عدم التكرار
      const product = await Product.findOneAndUpdate(
        { name: p.name },
        { $set: p },
        { upsert: true, new: true }
      );
      upsertedProducts.push(product);
    }
    console.log(`📦 ${upsertedProducts.length} products verified and safely upserted`);

    // 3. Seed Carts (إنشاء سلات تسوق آمنة)
    console.log("⏳ Seeding Carts...");
    for (let idx = 0; idx < upsertedUsers.length; idx++) {
      const user = upsertedUsers[idx];
      let cartItems = [];

      // إضافة منتجات للسلة فقط للمستخدمين العاديين
      if (user.role === "user") {
        cartItems = [
          {
            productId: upsertedProducts[idx % upsertedProducts.length]._id,
            quantity: 2,
          },
          {
            productId: upsertedProducts[(idx + 1) % upsertedProducts.length]._id,
            quantity: 1,
          },
        ];
      }

      await Cart.findOneAndUpdate(
        { userId: user._id },
        { $set: { userId: user._id, items: cartItems } },
        { upsert: true, new: true }
      );
    }
    console.log(`🛒 Carts verified and safely upserted for all users`);

    // ─── Summary ─────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  🌱 Safe Seeding completed successfully!");
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
