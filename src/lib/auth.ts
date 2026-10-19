import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "rifoi_admin_session";

function getSecret(): Uint8Array {
  const secret =
    process.env.ADMIN_SESSION_SECRET || "rifoi-dev-secret-change-in-production-please";
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(payload: {
  id: string;
  email: string;
  name: string;
}) {
  const token = await new SignJWT({ ...payload, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<{
  id: string;
  email: string;
  name: string;
} | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name ?? "Admin"),
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
