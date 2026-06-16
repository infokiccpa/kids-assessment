import fs from "fs";
import mongoose from "mongoose";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/MONGODB_URI="([^"]+)"/);
if (!match) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const uri = match[1];
const host = uri.match(/@([^/]+)/)?.[1];
console.log("Host in .env:", host);

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log("Connected successfully");
  const User = mongoose.model(
    "User",
    new mongoose.Schema({ email: String, role: String })
  );
  const count = await User.countDocuments();
  const admin = await User.findOne({ email: "admin@school.com" });
  console.log("User count:", count);
  console.log("Demo admin:", admin ? admin.email : "not found");
  process.exit(0);
} catch (err) {
  console.error("Connection failed:", err.message);
  process.exit(1);
}
