import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productImages, products, productVariants } from "@/db/schema";
import { asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const imgs = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder));
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
    return NextResponse.json({ product: p, images: imgs, variants });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().trim().min(2).max(500),
  slug: z.string().trim().max(500).optional().nullable(),
  sku: z.string().trim().max(100).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  brand: z.string().trim().max(255).optional().nullable(),
  description: z.string().max(50000).optional().nullable(),
  specifications: z.string().max(20000).optional().nullable(),
  materialCare: z.string().max(10000).optional().nullable(),
  regularPrice: z.number().int().min(0).max(100000000),
  salePrice: z.number().int().min(0).max(100000000).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(1000000),
  availabilityStatus: z.enum(["in_stock", "out_of_stock", "preorder"]),
  tags: z.string().max(2000).optional().nullable(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  status: z.enum(["draft", "published", "archived"]),
  shippingInfo: z.string().max(10000).optional().nullable(),
  returnInfo: z.string().max(10000).optional().nullable(),
  videoUrl: z.string().max(2000).optional().nullable(),
  metaTitle: z.string().max(500).optional().nullable(),
  metaDescription: z.string().max(2000).optional().nullable(),
  images: z
    .array(
      z.object({
        imageUrl: z.string().min(1).max(2000),
        alt: z.string().max(500).optional().nullable(),
        isMain: z.boolean().optional().default(false),
      })
    )
    .max(20),
  variants: z
    .array(
      z.object({
        size: z.string().max(100).optional().nullable(),
        color: z.string().max(100).optional().nullable(),
        model: z.string().max(255).optional().nullable(),
        priceOverride: z.number().int().min(0).nullable().optional(),
        stockQuantity: z.number().int().min(0).max(1000000),
        sku: z.string().max(100).optional().nullable(),
        isAvailable: z.boolean(),
      })
    )
    .max(200),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product data.", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let slug = d.slug?.trim() ? slugify(d.slug) : slugify(d.name);
    if (slug !== existing.slug) {
      const [dup] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);
      if (dup && dup.id !== id) slug = `${slug}-${Date.now().toString(36)}`;
    }

    await db
      .update(products)
      .set({
        name: d.name.trim(),
        slug,
        sku: d.sku?.trim() || existing.sku,
        categoryId: d.categoryId || null,
        brand: d.brand?.trim() || null,
        description: d.description?.trim() || null,
        specifications: d.specifications?.trim() || null,
        materialCare: d.materialCare?.trim() || null,
        regularPrice: d.regularPrice,
        salePrice: d.salePrice ?? null,
        stockQuantity: d.stockQuantity,
        availabilityStatus: d.availabilityStatus,
        tags: d.tags?.trim() || null,
        isFeatured: d.isFeatured,
        isNewArrival: d.isNewArrival,
        status: d.status,
        shippingInfo: d.shippingInfo?.trim() || null,
        returnInfo: d.returnInfo?.trim() || null,
        videoUrl: d.videoUrl?.trim() || null,
        metaTitle: d.metaTitle?.trim() || null,
        metaDescription: d.metaDescription?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    await db.delete(productImages).where(eq(productImages.productId, id));
    if (d.images.length) {
      const hasMain = d.images.some((i) => i.isMain);
      await db.insert(productImages).values(
        d.images.map((img, idx) => ({
          productId: id,
          imageUrl: img.imageUrl,
          alt: img.alt || null,
          sortOrder: idx,
          isMain: hasMain ? !!img.isMain : idx === 0,
        }))
      );
    }
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    if (d.variants.length) {
      await db.insert(productVariants).values(
        d.variants.map((v) => ({
          productId: id,
          size: v.size?.trim() || null,
          color: v.color?.trim() || null,
          model: v.model?.trim() || null,
          priceOverride: v.priceOverride ?? null,
          stockQuantity: v.stockQuantity,
          sku: v.sku?.trim() || null,
          isAvailable: v.isAvailable,
        }))
      );
    }
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("PUT /api/admin/products/[id]", e);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("DELETE /api/admin/products/[id]", e);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
