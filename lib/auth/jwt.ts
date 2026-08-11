import { SignJWT, jwtVerify } from "jose";
import { JWT_ALG, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/config";

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

let cachedKey: Uint8Array | undefined;

function getKey() {
  if (!cachedKey) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error("SESSION_SECRET is not set");
    }
    cachedKey = new TextEncoder().encode(secret);
  }
  return cachedKey;
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
