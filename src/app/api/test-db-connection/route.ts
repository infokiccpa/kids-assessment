import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  console.log("Debugging database connection from within container...");
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return NextResponse.json({
      success: false,
      error: "DATABASE_URL environment variable is missing inside the container!",
      envKeys: Object.keys(process.env).filter(k => k.includes("DB") || k.includes("DATABASE")),
    });
  }

  // Mask sensitive parts of the DB URL for safe logging
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":****@");

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    return NextResponse.json({
      success: true,
      maskedUrl,
      userCount,
      message: "Database connected successfully from the server!",
    });
  } catch (err: any) {
    await prisma.$disconnect();
    return NextResponse.json({
      success: false,
      maskedUrl,
      errorName: err.name,
      errorMessage: err.message,
      errorCode: err.code,
      meta: err.meta,
      stack: err.stack,
    }, { status: 500 });
  }
}
