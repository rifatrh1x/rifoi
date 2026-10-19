import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

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
        name: z.string().trim().min(2).max(255),
        slug: z.string().trim().max(255).optional(),
        description: z.string().max(5000).optional().nullable(),
        imageUrl: z.string().max(2000).optional().nullable(),
        sortOrder: z.number().int().min(0).max(10000),
        isPublished: z.boolean(),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
    const d = parsed.data;
    await db
      .update(categories)
      .set({
        name: d.name.trim(),
        slug: d.slug?.trim() ? slugify(d.slug) : slugify(d.name),
        description: d.description?.trim() || null,
        imageUrl: d.imageUrl?.trim() || null,
        sortOrder: d.sortOrder,
        isPublished: d.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("PUT /api/admin/categories/[id]", e);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    // Unlink products instead of blocking delete
    await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("DELETE /api/admin/categories/[id]", e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
