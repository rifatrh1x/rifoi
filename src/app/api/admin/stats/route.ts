import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages, orders, products } from "@/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const [revenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${orders.total}), 0)` })
      .from(orders)
      .where(and(ne(orders.status, "cancelled"), ne(orders.status, "returned")));
    const [orderCount] = await db.select({ c: sql<number>`count(*)` }).from(orders);
    const [pendingCount] = await db
      .select({ c: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));
    const [productCount] = await db.select({ c: sql<number>`count(*)` }).from(products);
    const [lowStock] = await db
      .select({ c: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.stockQuantity} <= 5 AND ${products.status} = 'published'`);
    const [unreadMsg] = await db
      .select({ c: sql<number>`count(*)` })
      .from(contactMessages)
      .where(eq(contactMessages.isRead, false));

    const byStatus = await db
      .select({ status: orders.status, c: sql<number>`count(*)` })
      .from(orders)
      .groupBy(orders.status);

    const recentOrders = await db
      .select({
        id: orders.id,
        orderRef: orders.orderRef,
        customerName: orders.customerName,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8);

    const topProducts = await db
      .select({ id: products.id, name: products.name, slug: products.slug, soldCount: products.soldCount, stockQuantity: products.stockQuantity })
      .from(products)
      .orderBy(desc(products.soldCount))
      .limit(8);

    const last7 = await db
      .select({
        day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        total: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= NOW() - INTERVAL '7 days'`)
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    return NextResponse.json({
      revenue: Number(revenue?.total || 0),
      orders: Number(orderCount?.c || 0),
      pending: Number(pendingCount?.c || 0),
      products: Number(productCount?.c || 0),
      lowStock: Number(lowStock?.c || 0),
      unreadMessages: Number(unreadMsg?.c || 0),
      byStatus: byStatus.map((b) => ({ status: b.status, count: Number(b.c) })),
      recentOrders,
      topProducts,
      last7days: last7.map((r) => ({ day: r.day, total: Number(r.total), count: Number(r.count) })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("GET /api/admin/stats", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
