import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder));
    return NextResponse.json({ banners: rows });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load banners" }, { status: 500 });
  }
}

const schema = z.object({
  title: z.string().max(500).optional().nullable(),
  subtitle: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().max(2000).optional().nullable(),
  ctaText: z.string().max(255).optional().nullable(),
  ctaLink: z.string().max(500).optional().nullable(),
  position: z.enum(["hero", "promo", "category", "offer"]).optional().default("hero"),
  sortOrder: z.number().int().min(0).max(10000).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid banner data." }, { status: 400 });
    const d = parsed.data;
    const [row] = await db
      .insert(banners)
      .values({
        title: d.title?.trim() || null,
        subtitle: d.subtitle?.trim() || null,
        imageUrl: d.imageUrl?.trim() || null,
        ctaText: d.ctaText?.trim() || null,
        ctaLink: d.ctaLink?.trim() || null,
        position: d.position,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
      })
      .returning({ id: banners.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}
