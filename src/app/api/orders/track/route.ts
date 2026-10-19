import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = z
      .object({ orderRef: z.string().trim().min(3).max(50), phone: z.string().trim().min(6).max(50) })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter your order reference and phone number." }, { status: 400 });
    }
    const { orderRef, phone } = parsed.data;
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderRef, orderRef.trim()), eq(orders.customerPhone, phone.replace(/[\s-]/g, ""))))
      .limit(1);
    if (!rows.length) {
      return NextResponse.json({ error: "Order not found. Check your reference and phone number." }, { status: 404 });
    }
    const o = rows[0];
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    return NextResponse.json({
      order: {
        orderRef: o.orderRef,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        discount: o.discount,
        deliveryFee: o.deliveryFee,
        total: o.total,
        district: o.district,
        createdAt: o.createdAt,
        items: items.map((i) => ({
          name: i.productName,
          variant: (i.variantInfo as { label?: string } | null)?.label || null,
          qty: i.quantity,
          unitPrice: i.unitPrice,
          total: i.totalPrice,
        })),
      },
    });
  } catch (e) {
    console.error("POST /api/orders/track", e);
    return NextResponse.json({ error: "Failed to track order" }, { status: 500 });
  }
}
