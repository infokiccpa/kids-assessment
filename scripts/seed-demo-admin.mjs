import fs from "fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DEMO_ADMIN_EMAIL = "admin@school.com";
const DEMO_ADMIN_PASSWORD = "admin123";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/MONGODB_URI="([^"]+)"/);
if (!match) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "PARENT" },
    phone: { type: String },
  },
  { timestamps: true }
);

const uri = match[1];
console.log("Connecting to MongoDB...");

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const existing = await User.findOne({ email: DEMO_ADMIN_EMAIL });
  if (existing) {
    console.log("Demo admin already exists:", DEMO_ADMIN_EMAIL);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  await User.create({
    email: DEMO_ADMIN_EMAIL,
    name: "Demo Admin",
    password: hashedPassword,
    role: "ADMIN",
  });

  console.log("Demo admin created successfully!");
  console.log("  Email:   ", DEMO_ADMIN_EMAIL);
  console.log("  Password:", DEMO_ADMIN_PASSWORD);
  process.exit(0);
} catch (err) {
  console.error("Seed failed:", err.message);
  if (err.message.includes("whitelist")) {
    console.error(
      "\nAdd your IP in MongoDB Atlas → Network Access → Add IP Address, then run again."
    );
  }
  process.exit(1);
}
