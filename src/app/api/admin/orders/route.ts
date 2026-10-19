import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") || "").trim();
    const status = sp.get("status") || "";
    const payment = sp.get("payment") || "";
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) {
      conditions.push(
        or(
          ilike(orders.orderRef, `%${q}%`),
          ilike(orders.customerName, `%${q}%`),
          ilike(orders.customerPhone, `%${q}%`)
        )
      );
    }
    if (status) conditions.push(eq(orders.status, status));
    if (payment) conditions.push(eq(orders.paymentStatus, payment));
    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(where);
    const total = Number(countRow?.count || 0);
    const rows = await db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
    return NextResponse.json({
      orders: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("GET /api/admin/orders", e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
