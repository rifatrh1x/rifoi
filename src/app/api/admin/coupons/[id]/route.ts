import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = z
      .object({
        code: z.string().trim().min(2).max(100),
        discountType: z.enum(["percent", "fixed"]),
        value: z.number().int().min(1).max(1000000),
        minOrderAmount: z.number().int().min(0).max(100000000),
        maxDiscountAmount: z.number().int().min(0).max(100000000).optional().nullable(),
        usageLimit: z.number().int().min(1).max(1000000).optional().nullable(),
        expiresAt: z.string().optional().nullable(),
        isActive: z.boolean(),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid coupon data." }, { status: 400 });
    if (parsed.data.discountType === "percent" && parsed.data.value > 100)
      return NextResponse.json({ error: "Percent discount cannot exceed 100." }, { status: 400 });
    const d = parsed.data;
    await db
      .update(coupons)
      .set({
        code: d.code.trim().toUpperCase(),
        discountType: d.discountType,
        value: d.value,
        minOrderAmount: d.minOrderAmount,
        maxDiscountAmount: d.maxDiscountAmount ?? null,
        usageLimit: d.usageLimit ?? null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        isActive: d.isActive,
      })
      .where(eq(coupons.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.delete(coupons).where(eq(coupons.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
