import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cmsPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(cmsPages);
    return NextResponse.json({ pages: rows });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load pages" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = z
      .object({
        slug: z.string().trim().min(1).max(255),
        title: z.string().trim().min(1).max(500),
        content: z.string().max(100000),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid page data." }, { status: 400 });
    const d = parsed.data;
    await db
      .insert(cmsPages)
      .values({ slug: d.slug, title: d.title, content: d.content })
      .onConflictDoUpdate({
        target: cmsPages.slug,
        set: { title: d.title, content: d.content, updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to save page" }, { status: 500 });
  }
}
