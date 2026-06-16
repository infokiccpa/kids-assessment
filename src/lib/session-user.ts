import type { Session } from "next-auth";

export function sessionToAppUser(session: Session | null) {
  if (!session?.user?.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? "",
    role: session.user.role || "PARENT",
  };
}
