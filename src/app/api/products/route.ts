import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, productImages, products, productVariants } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") || "").trim().slice(0, 100);
    const categorySlug = (sp.get("category") || "").trim();
    const min = sp.get("min") ? Number(sp.get("min")) : null;
    const max = sp.get("max") ? Number(sp.get("max")) : null;
    const brand = (sp.get("brand") || "").trim().slice(0, 100);
    const size = (sp.get("size") || "").trim().slice(0, 50);
    const color = (sp.get("color") || "").trim().slice(0, 50);
    const availability = sp.get("availability") || "";
    const sort = sp.get("sort") || "newest";
    const featured = sp.get("featured") === "true";
    const isNew = sp.get("new") === "true";
    const bestseller = sp.get("bestseller") === "true";
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(60, Math.max(1, Number(sp.get("limit")) || 12));
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [eq(products.status, "published")];

    if (q) {
      conditions.push(
        or(
          ilike(products.name, `%${q}%`),
          ilike(products.description, `%${q}%`),
          ilike(products.sku, `%${q}%`),
          ilike(products.brand, `%${q}%`),
          ilike(products.tags, `%${q}%`)
        ) as never
      );
    }
    if (categorySlug) {
      const cat = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);
      if (cat.length) conditions.push(eq(products.categoryId, cat[0].id) as never);
    }
    const priceExpr = sql`COALESCE(${products.salePrice}, ${products.regularPrice})`;
    if (min !== null && !Number.isNaN(min)) conditions.push(gte(priceExpr, min) as never);
    if (max !== null && !Number.isNaN(max)) conditions.push(lte(priceExpr, max) as never);
    if (brand) conditions.push(ilike(products.brand, brand) as never);
    if (availability === "in_stock") conditions.push(eq(products.availabilityStatus, "in_stock") as never);
    if (featured) conditions.push(eq(products.isFeatured, true) as never);
    if (isNew) conditions.push(eq(products.isNewArrival, true) as never);

    if (size || color) {
      const vConds = [];
      if (size) vConds.push(eq(productVariants.size, size));
      if (color) vConds.push(eq(productVariants.color, color));
      const vRows = await db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(and(...vConds, eq(productVariants.isAvailable, true)));
      const ids = [...new Set(vRows.map((r) => r.productId))];
      if (!ids.length) {
        return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });
      }
      conditions.push(inArray(products.id, ids) as never);
    }

    let orderBy: ReturnType<typeof desc> = desc(products.createdAt);
    if (sort === "price-asc") orderBy = asc(priceExpr) as never;
    else if (sort === "price-desc") orderBy = desc(priceExpr) as never;
    else if (sort === "popular") orderBy = desc(products.soldCount) as never;
    else if (sort === "rating") orderBy = desc(products.viewCount) as never;
    if (bestseller) orderBy = desc(products.soldCount) as never;

    const where = and(...conditions);
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(where);
    const total = Number(countRow?.count || 0);

    const rows = await db
      .select()
      .from(products)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const ids = rows.map((r) => r.id);
    let imagesByProduct: Record<string, { imageUrl: string; alt: string | null }[]> = {};
    let categoryNames: Record<string, string> = {};
    if (ids.length) {
      const imgs = await db
        .select()
        .from(productImages)
        .where(inArray(productImages.productId, ids))
        .orderBy(asc(productImages.sortOrder));
      for (const img of imgs) {
        if (!imagesByProduct[img.productId]) imagesByProduct[img.productId] = [];
        imagesByProduct[img.productId].push({ imageUrl: img.imageUrl, alt: img.alt });
      }
      const cats = await db.select().from(categories);
      for (const c of cats) categoryNames[c.id] = c.name;
    }

    const data = rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      brand: p.brand,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      effectivePrice: p.salePrice ?? p.regularPrice,
      discountPercent:
        p.salePrice && p.salePrice < p.regularPrice
          ? Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100)
          : 0,
      stockQuantity: p.stockQuantity,
      availabilityStatus: p.availabilityStatus,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      soldCount: p.soldCount,
      category: p.categoryId ? categoryNames[p.categoryId] || null : null,
      image: imagesByProduct[p.id]?.[0]?.imageUrl || null,
      images: (imagesByProduct[p.id] || []).map((i) => i.imageUrl),
      tags: p.tags,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      products: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("GET /api/products", e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
