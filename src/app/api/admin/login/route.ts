import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth";

const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rec = attempts.get(ip);
    if (rec && rec.lockedUntil > Date.now()) {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }
    const body = await req.json();
    const parsed = z
      .object({ email: z.string().trim().email().max(255), password: z.string().min(1).max(200) })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, parsed.data.email.toLowerCase()))
      .limit(1);
    const ok = admin ? await bcrypt.compare(parsed.data.password, admin.passwordHash) : false;
    if (!admin || !ok) {
      const next = { count: (rec?.count || 0) + 1, lockedUntil: 0 };
      if (next.count >= MAX_ATTEMPTS) {
        next.lockedUntil = Date.now() + LOCK_MS;
        next.count = 0;
      }
      attempts.set(ip, next);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    attempts.delete(ip);
    await createAdminSession({ id: admin.id, email: admin.email, name: admin.name });
    return NextResponse.json({ ok: true, user: { email: admin.email, name: admin.name } });
  } catch (e) {
    console.error("POST /api/admin/login", e);
    return NextResponse.json({ error: "Login failed. Try again." }, { status: 500 });
  }
}
