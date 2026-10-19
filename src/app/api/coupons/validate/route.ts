import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = z
      .object({ code: z.string().trim().min(2).max(100), subtotal: z.number().min(0) })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const code = parsed.data.code.toUpperCase();
    const [cp] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!cp || !cp.isActive) return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
    if (cp.expiresAt && new Date(cp.expiresAt) < new Date())
      return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
    if (cp.usageLimit != null && cp.usedCount >= cp.usageLimit)
      return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
    if (parsed.data.subtotal < cp.minOrderAmount)
      return NextResponse.json(
        { error: `Minimum order ৳${cp.minOrderAmount.toLocaleString()} needed.` },
        { status: 400 }
      );
    let discount = cp.discountType === "percent" ? Math.round((parsed.data.subtotal * cp.value) / 100) : cp.value;
    if (cp.maxDiscountAmount != null) discount = Math.min(discount, cp.maxDiscountAmount);
    discount = Math.min(discount, parsed.data.subtotal);
    return NextResponse.json({ ok: true, code, discount });
  } catch (e) {
    console.error("POST /api/coupons/validate", e);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
