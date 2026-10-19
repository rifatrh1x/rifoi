import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = z
      .object({
        title: z.string().max(500).optional().nullable(),
        subtitle: z.string().max(5000).optional().nullable(),
        imageUrl: z.string().max(2000).optional().nullable(),
        ctaText: z.string().max(255).optional().nullable(),
        ctaLink: z.string().max(500).optional().nullable(),
        position: z.enum(["hero", "promo", "category", "offer"]),
        sortOrder: z.number().int().min(0).max(10000),
        isActive: z.boolean(),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid banner data." }, { status: 400 });
    const d = parsed.data;
    await db
      .update(banners)
      .set({
        title: d.title?.trim() || null,
        subtitle: d.subtitle?.trim() || null,
        imageUrl: d.imageUrl?.trim() || null,
        ctaText: d.ctaText?.trim() || null,
        ctaLink: d.ctaLink?.trim() || null,
        position: d.position,
        sortOrder: d.sortOrder,
        isActive: d.isActive,
      })
      .where(eq(banners.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.delete(banners).where(eq(banners.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
