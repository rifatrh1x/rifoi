import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, productImages, products, productVariants } from "@/db/schema";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.status, "published")))
      .limit(1);
    if (!rows.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const p = rows[0];

    const imgs = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, p.id))
      .orderBy(asc(productImages.sortOrder));

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, p.id));

    let category: { id: string; name: string; slug: string } | null = null;
    if (p.categoryId) {
      const c = await db
        .select()
        .from(categories)
        .where(eq(categories.id, p.categoryId))
        .limit(1);
      if (c.length) category = { id: c[0].id, name: c[0].name, slug: c[0].slug };
    }

    let related: { id: string; name: string; slug: string; regularPrice: number; salePrice: number | null; image: string | null }[] = [];
    if (p.categoryId) {
      const rel = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.status, "published"),
            eq(products.categoryId, p.categoryId),
            ne(products.id, p.id)
          )
        )
        .orderBy(desc(products.soldCount))
        .limit(8);
      const relIds = rel.map((r) => r.id);
      const relImgs =
        relIds.length > 0
          ? await db
              .select()
              .from(productImages)
              .where(
                and(
                  sql`${productImages.productId} = ANY(${relIds})`,
                  eq(productImages.isMain, true)
                )
              )
          : [];
      const mainById: Record<string, string> = {};
      for (const im of relImgs) mainById[im.productId] = im.imageUrl;
      related = rel.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        regularPrice: r.regularPrice,
        salePrice: r.salePrice,
        image: mainById[r.id] || null,
      }));
    }

    // bump views (fire and forget)
    db.update(products)
      .set({ viewCount: sql`${products.viewCount} + 1` })
      .where(eq(products.id, p.id))
      .catch(() => {});

    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];
    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
    const models = [...new Set(variants.map((v) => v.model).filter(Boolean))] as string[];

    return NextResponse.json({
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brand: p.brand,
        description: p.description,
        specifications: p.specifications,
        materialCare: p.materialCare,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        effectivePrice: p.salePrice ?? p.regularPrice,
        discountPercent:
          p.salePrice && p.salePrice < p.regularPrice
            ? Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100)
            : 0,
        stockQuantity: p.stockQuantity,
        availabilityStatus: p.availabilityStatus,
        tags: p.tags,
        shippingInfo: p.shippingInfo,
        returnInfo: p.returnInfo,
        videoUrl: p.videoUrl,
        soldCount: p.soldCount,
        category,
        images: imgs.map((i) => ({ id: i.id, url: i.imageUrl, alt: i.alt, isMain: i.isMain })),
        variants: variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          model: v.model,
          priceOverride: v.priceOverride,
          stockQuantity: v.stockQuantity,
          sku: v.sku,
          isAvailable: v.isAvailable,
        })),
        sizes,
        colors,
        models,
        hasVariants: variants.length > 0,
      },
      related,
    });
  } catch (e) {
    console.error("GET /api/products/[slug]", e);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}
