import bcrypt from "bcryptjs";
import { User } from "@/lib/models";

const DEMO_ADMIN_EMAIL = "admin@school.com";
const DEMO_ADMIN_PASSWORD = "admin123";

/** Ensures demo admin exists in MongoDB (used on connect and via test API). */
export async function ensureDemoAdmin(): Promise<{ created: boolean; email: string }> {
  const existing = await User.findOne({ email: DEMO_ADMIN_EMAIL });
  if (existing) {
    return { created: false, email: DEMO_ADMIN_EMAIL };
  }

  const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  await User.create({
    email: DEMO_ADMIN_EMAIL,
    name: "Demo Admin",
    password: hashedPassword,
    role: "ADMIN",
  });

  return { created: true, email: DEMO_ADMIN_EMAIL };
}
