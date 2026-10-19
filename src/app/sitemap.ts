import type { MetadataRoute } from "next";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticPages = [
    "",
    "/shop",
    "/cart",
    "/checkout",
    "/track-order",
    "/wishlist",
    "/about",
    "/contact",
    "/faq",
    "/shipping-policy",
    "/return-policy",
    "/privacy-policy",
    "/terms",
  ].map((p) => ({ url: `${base}${p}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));

  try {
    const prods = await db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.status, "published"));
    const cats = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(eq(categories.isPublished, true));
    return [
      ...staticPages,
      ...cats.map((c) => ({
        url: `${base}/shop?category=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...prods.map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticPages;
  }
}
