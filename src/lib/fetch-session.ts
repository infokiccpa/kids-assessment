import type { Session } from "next-auth";

/** Fetch NextAuth session with retries (avoids transient dev/HMR fetch failures). */
export async function fetchSessionWithRetry(
  maxAttempts = 4,
  delayMs = 250
): Promise<Session | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch("/api/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Session HTTP ${res.status}`);
      const data = (await res.json()) as Session;
      return data?.user?.email ? data : null;
    } catch {
      if (attempt === maxAttempts) return null;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  return null;
}
