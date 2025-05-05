require("dotenv").config(); // Load .env
const mongoose = require("mongoose");
const User = require("./models/user");
// const bcrypt = require('bcrypt'); // Nếu dùng bcrypt

const MONGODB_URI = process.env.MONGODB_URI;

const createAdminUser = async () => {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for admin creation.");

    const adminEmail = "admin@example.com"; // Thay đổi email nếu cần
    const adminPassword = "yourSecurePassword"; // Thay đổi password
    const adminName = "Admin User";

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdmin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // Thay bằng hashedPassword
      role: "admin",
      verified: true, // Tự động xác thực
      verificationToken: undefined,
    });

    await newAdmin.save();
    console.log(`Admin user ${adminEmail} created successfully!`);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
};

createAdminUser();
