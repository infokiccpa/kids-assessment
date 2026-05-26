import { NextResponse } from "next/server";

/** Confirms production runs MongoDB build (not legacy Prisma/MySQL). */
export async function GET() {
  const usesLegacyDb =
    Boolean(process.env.DATABASE_URL) &&
    !process.env.DATABASE_URL?.startsWith("mongodb");

  return NextResponse.json({
    ok: true,
    app: "kids-assessment",
    database: "mongodb",
    version: "0.2.0-mongodb",
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    warning: usesLegacyDb
      ? "DATABASE_URL is set to a non-MongoDB URL — remove it; use MONGODB_URI only."
      : null,
  });
}
