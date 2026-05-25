import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";
import mongoose from "mongoose";

export async function GET() {
  const mongoUri = process.env.MONGODB_URI || "";
  const maskedUri = mongoUri.replace(/:([^@]+)@/, ":****@");

  if (!mongoUri) {
    return NextResponse.json({
      success: false,
      error: "MONGODB_URI environment variable is missing inside the container!",
      envKeys: Object.keys(process.env).filter(
        (k) => k.includes("MONGO") || k.includes("DB")
      ),
    });
  }

  try {
    await connectDB();
    const userCount = await User.countDocuments();
    return NextResponse.json({
      success: true,
      maskedUri,
      userCount,
      mongooseState: mongoose.connection.readyState,
      message: "MongoDB connected successfully!",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        maskedUri,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}
