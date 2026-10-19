import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.isPublished, true))
      .orderBy(asc(categories.sortOrder));
    const counts = await db
      .select({ categoryId: products.categoryId, count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.status, "published"))
      .groupBy(products.categoryId);
    const countMap: Record<string, number> = {};
    for (const c of counts) if (c.categoryId) countMap[c.categoryId] = Number(c.count);
    return NextResponse.json({
      categories: cats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        productCount: countMap[c.id] || 0,
      })),
    });
  } catch (e) {
    console.error("GET /api/categories", e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
