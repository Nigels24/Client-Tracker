import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { verifySessionToken, type SessionPayload } from "@/lib/auth/jwt";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
