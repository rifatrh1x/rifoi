import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return NextResponse.json({ coupons: rows });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

const schema = z.object({
  code: z.string().trim().min(2).max(100),
  discountType: z.enum(["percent", "fixed"]),
  value: z.number().int().min(1).max(1000000),
  minOrderAmount: z.number().int().min(0).max(100000000).optional().default(0),
  maxDiscountAmount: z.number().int().min(0).max(100000000).optional().nullable(),
  usageLimit: z.number().int().min(1).max(1000000).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid coupon data." }, { status: 400 });
    if (parsed.data.discountType === "percent" && parsed.data.value > 100)
      return NextResponse.json({ error: "Percent discount cannot exceed 100." }, { status: 400 });
    const d = parsed.data;
    const [row] = await db
      .insert(coupons)
      .values({
        code: d.code.trim().toUpperCase(),
        discountType: d.discountType,
        value: d.value,
        minOrderAmount: d.minOrderAmount,
        maxDiscountAmount: d.maxDiscountAmount ?? null,
        usageLimit: d.usageLimit ?? null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        isActive: d.isActive,
      })
      .returning({ id: coupons.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/admin/coupons", e);
    return NextResponse.json({ error: "Failed to create coupon (code may already exist)." }, { status: 500 });
  }
}
