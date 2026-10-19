import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const parsed = z
      .object({
        currentPassword: z.string().min(1).max(200),
        newPassword: z.string().min(8).max(200),
      })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.id)).limit(1);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ok = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    const hash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.update(adminUsers).set({ passwordHash: hash }).where(eq(adminUsers.id, admin.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/admin/change-password", e);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
