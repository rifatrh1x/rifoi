import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return NextResponse.json({ categories: rows });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = z
      .object({
        name: z.string().trim().min(2).max(255),
        slug: z.string().trim().max(255).optional(),
        description: z.string().max(5000).optional().nullable(),
        imageUrl: z.string().max(2000).optional().nullable(),
        sortOrder: z.number().int().min(0).max(10000).optional().default(0),
        isPublished: z.boolean().optional().default(true),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
    const d = parsed.data;
    const slug = d.slug?.trim() ? slugify(d.slug) : slugify(d.name);
    const [row] = await db
      .insert(categories)
      .values({
        name: d.name.trim(),
        slug,
        description: d.description?.trim() || null,
        imageUrl: d.imageUrl?.trim() || null,
        sortOrder: d.sortOrder,
        isPublished: d.isPublished,
      })
      .returning({ id: categories.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/admin/categories", e);
    return NextResponse.json({ error: "Failed to create category (slug may already exist)." }, { status: 500 });
  }
}
