import { NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(asc(banners.sortOrder));
    return NextResponse.json({ banners: rows });
  } catch (e) {
    console.error("GET /api/banners", e);
    return NextResponse.json({ error: "Failed to load banners" }, { status: 500 });
  }
}
