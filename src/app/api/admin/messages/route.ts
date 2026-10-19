import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const unreadOnly = sp.get("unread") === "true";
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
    const where = unreadOnly ? eq(contactMessages.isRead, false) : undefined;
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(contactMessages).where(where);
    const rows = await db
      .select()
      .from(contactMessages)
      .where(where)
      .orderBy(desc(contactMessages.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);
    return NextResponse.json({
      messages: rows,
      total: Number(countRow?.count || 0),
      page,
      limit,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
