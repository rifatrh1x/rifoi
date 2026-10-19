import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, productImages, products, productVariants } from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { generateSku, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

const imageSchema = z.object({
  imageUrl: z.string().min(1).max(2000),
  alt: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).max(100).optional().default(0),
  isMain: z.boolean().optional().default(false),
});

const variantSchema = z.object({
  size: z.string().max(100).optional().nullable(),
  color: z.string().max(100).optional().nullable(),
  model: z.string().max(255).optional().nullable(),
  priceOverride: z.number().int().min(0).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(1000000).optional().default(0),
  sku: z.string().max(100).optional().nullable(),
  isAvailable: z.boolean().optional().default(true),
});

const productSchema = z.object({
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
  stockQuantity: z.number().int().min(0).max(1000000).optional().default(0),
  availabilityStatus: z.enum(["in_stock", "out_of_stock", "preorder"]).optional().default("in_stock"),
  tags: z.string().max(2000).optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(true),
  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
  shippingInfo: z.string().max(10000).optional().nullable(),
  returnInfo: z.string().max(10000).optional().nullable(),
  videoUrl: z.string().max(2000).optional().nullable(),
  metaTitle: z.string().max(500).optional().nullable(),
  metaDescription: z.string().max(2000).optional().nullable(),
  images: z.array(imageSchema).max(20).optional().default([]),
  variants: z.array(variantSchema).max(200).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") || "").trim();
    const status = sp.get("status") || "";
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) {
      conditions.push(
        or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`), ilike(products.slug, `%${q}%`))
      );
    }
    if (status && ["draft", "published", "archived"].includes(status)) {
      conditions.push(eq(products.status, status));
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(products).where(where);
    const total = Number(countRow?.count || 0);
    const rows = await db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.updatedAt))
      .limit(limit)
      .offset(offset);

    const ids = rows.map((r) => r.id);
    const mainImgs =
      ids.length > 0
        ? await db.select().from(productImages).where(inArray(productImages.productId, ids))
        : [];
    const mainById: Record<string, string> = {};
    const sorted = [...mainImgs].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const im of sorted) {
      if (im.isMain || !mainById[im.productId]) mainById[im.productId] = im.imageUrl;
    }
    const cats = await db.select().from(categories);
    const catMap: Record<string, string> = {};
    for (const c of cats) catMap[c.id] = c.name;

    return NextResponse.json({
      products: rows.map((p) => ({
        ...p,
        categoryName: p.categoryId ? catMap[p.categoryId] || "—" : "—",
        mainImage: mainById[p.id] || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("GET /api/admin/products", e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product data.", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    let slug = d.slug?.trim() ? slugify(d.slug) : slugify(d.name);
    if (!slug) slug = `product-${Date.now()}`;
    const [dup] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (dup) slug = `${slug}-${Date.now().toString(36)}`;

    const [prod] = await db
      .insert(products)
      .values({
        name: d.name.trim(),
        slug,
        sku: d.sku?.trim() || generateSku(d.name),
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
      })
      .returning({ id: products.id, slug: products.slug });

    if (d.images.length) {
      let hasMain = d.images.some((i) => i.isMain);
      await db.insert(productImages).values(
        d.images.map((img, idx) => ({
          productId: prod.id,
          imageUrl: img.imageUrl,
          alt: img.alt || null,
          sortOrder: idx,
          isMain: hasMain ? !!img.isMain : idx === 0,
        }))
      );
    }
    if (d.variants.length) {
      await db.insert(productVariants).values(
        d.variants.map((v) => ({
          productId: prod.id,
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
    return NextResponse.json({ ok: true, id: prod.id, slug: prod.slug });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/admin/products", e);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
