import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPages } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const rows = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug)).limit(1);
    if (!rows.length) return NextResponse.json({ error: "Page not found" }, { status: 404 });
    return NextResponse.json({ page: rows[0] });
  } catch (e) {
    console.error("GET /api/pages/[slug]", e);
    return NextResponse.json({ error: "Failed to load page" }, { status: 500 });
  }
}
