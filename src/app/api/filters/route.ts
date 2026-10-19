import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sizes = await db
      .selectDistinct({ size: productVariants.size })
      .from(productVariants);
    const colors = await db
      .selectDistinct({ color: productVariants.color })
      .from(productVariants);
    const brands = await db
      .selectDistinct({ brand: products.brand })
      .from(products)
      .where(eq(products.status, "published"));
    const [range] = await db
      .select({
        min: sql<number>`COALESCE(MIN(COALESCE(${products.salePrice}, ${products.regularPrice})), 0)`,
        max: sql<number>`COALESCE(MAX(COALESCE(${products.salePrice}, ${products.regularPrice})), 10000)`,
      })
      .from(products)
      .where(eq(products.status, "published"));
    return NextResponse.json({
      sizes: sizes.map((s) => s.size).filter(Boolean),
      colors: colors.map((c) => c.color).filter(Boolean),
      brands: brands.map((b) => b.brand).filter(Boolean),
      priceRange: { min: Number(range?.min || 0), max: Number(range?.max || 10000) },
    });
  } catch (e) {
    console.error("GET /api/filters", e);
    return NextResponse.json({ sizes: [], colors: [], brands: [], priceRange: { min: 0, max: 10000 } });
  }
}
