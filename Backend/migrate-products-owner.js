/**
 * Migration Script: Assign existing products without `createdBy` to the first available admin user.
 * 
 * Usage: node migrate-products-owner.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { connect, closeMongoDBConnection } = require("./Config/DB");
const User = require("./Models/User.Model");
const Product = require("./Models/Products.Model");

async function migrate() {
  try {
    console.log("Connecting to Database...");
    await connect();

    // 1. Find the first admin user
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("No admin found. Searching for any active user...");
      admin = await User.findOne({});
    }

    if (!admin) {
      console.error("❌ No users found in database to assign as owner.");
      process.exit(1);
    }

    console.log(`Found Admin/Owner User: ${admin.name} (${admin.email}) [ID: ${admin._id}]`);

    // 2. Find products missing createdBy
    const productsWithoutOwner = await Product.find({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });

    console.log(`Found ${productsWithoutOwner.length} products without an owner.`);

    if (productsWithoutOwner.length > 0) {
      const result = await Product.updateMany(
        {
          $or: [
            { createdBy: { $exists: false } },
            { createdBy: null }
          ]
        },
        { $set: { createdBy: admin._id } }
      );

      console.log(`✅ Successfully updated ${result.modifiedCount} products with createdBy = ${admin._id}`);
    } else {
      console.log("✅ All products already have a createdBy owner.");
    }

    await closeMongoDBConnection();
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
