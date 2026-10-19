import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems, orders, products, productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return NextResponse.json({ order: o, items });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = z
      .object({
        status: z
          .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"])
          .optional(),
        paymentStatus: z
          .enum(["pending", "pending_verification", "verified", "paid", "failed", "refunded"])
          .optional(),
        transactionRef: z.string().max(255).optional().nullable(),
        adminNotes: z.string().max(5000).optional().nullable(),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid update data." }, { status: 400 });

    const [prev] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!prev) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const d = parsed.data;
    await db
      .update(orders)
      .set({
        ...(d.status ? { status: d.status } : {}),
        ...(d.paymentStatus ? { paymentStatus: d.paymentStatus } : {}),
        ...(d.transactionRef !== undefined ? { transactionRef: d.transactionRef?.trim() || null } : {}),
        ...(d.adminNotes !== undefined ? { adminNotes: d.adminNotes?.trim() || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));

    // Restore stock when cancelling/returning (only once)
    const finalStatuses = ["cancelled", "returned"];
    if (
      d.status &&
      finalStatuses.includes(d.status) &&
      !finalStatuses.includes(prev.status)
    ) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
      for (const it of items) {
        const info = it.variantInfo as { variantId?: string } | null;
        if (info?.variantId) {
          await db
            .update(productVariants)
            .set({ stockQuantity: sql`${productVariants.stockQuantity} + ${it.quantity}` })
            .where(eq(productVariants.id, info.variantId));
        } else if (it.productId) {
          await db
            .update(products)
            .set({ stockQuantity: sql`${products.stockQuantity} + ${it.quantity}` })
            .where(eq(products.id, it.productId));
        }
        if (it.productId) {
          await db
            .update(products)
            .set({ soldCount: sql`GREATEST(0, ${products.soldCount} - ${it.quantity})` })
            .where(eq(products.id, it.productId));
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("PATCH /api/admin/orders/[id]", e);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
