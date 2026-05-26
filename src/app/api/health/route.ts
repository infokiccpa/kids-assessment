import { NextResponse } from "next/server";

/** Use after deploy to confirm live runs MongoDB code (not old Prisma/SQLite build). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "kids-assessment",
    database: "mongodb",
    version: "0.2.0-mongodb",
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
  });
}
