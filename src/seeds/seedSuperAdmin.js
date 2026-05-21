/**
 * Super Admin Seed Script
 * 
 * Seeds the initial super_admin user into MongoDB.
 * Run: node src/seeds/seedSuperAdmin.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const SuperAdmin = require("../models/SuperAdmin");

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await SuperAdmin.findOne({ email: "navaneetsharma22@gmail.com" });

    if (existingAdmin) {
      console.log("✅ Super Admin already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Status: ${existingAdmin.status}`);
      console.log("\n⚠️  Skipping seed. Delete the existing record first if you want to re-seed.");
    } else {
      const superAdmin = await SuperAdmin.create({
        name: "Navaneet Sharma",
        email: "navaneetsharma22@gmail.com",
        password: "Nav@456789",  // min 8 chars as required by model validation
        role: "super_admin",
        status: "active",
      });

      console.log("🚀 Super Admin seeded successfully!");
      console.log(`   ID: ${superAdmin._id}`);
      console.log(`   Name: ${superAdmin.name}`);
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Role: ${superAdmin.role}`);
      console.log(`   Status: ${superAdmin.status}`);
      console.log("\n🔐 Login Credentials:");
      console.log(`   Email: navaneetsharma22@gmail.com`);
      console.log(`   Password: Nav@456789`);
      console.log(`   Endpoint: POST /api/admin/login`);
    }

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
