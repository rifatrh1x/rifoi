import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories, productImages, products, productVariants } from "@/db/schema";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import ProductDetails from "@/components/ProductDetails";
import ProductCard from "@/components/ProductCard";
import { SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "published")))
    .limit(1);
  if (!rows.length) return null;
  const p = rows[0];
  const imgs = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, p.id))
    .orderBy(asc(productImages.sortOrder));
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, p.id));
  let category: { id: string; name: string; slug: string } | null = null;
  if (p.categoryId) {
    const c = await db.select().from(categories).where(eq(categories.id, p.categoryId)).limit(1);
    if (c.length) category = { id: c[0].id, name: c[0].name, slug: c[0].slug };
  }
  let related: { id: string; name: string; slug: string; regularPrice: number; salePrice: number | null; image: string | null }[] = [];
  if (p.categoryId) {
    const rel = await db
      .select()
      .from(products)
      .where(and(eq(products.status, "published"), eq(products.categoryId, p.categoryId), ne(products.id, p.id)))
      .orderBy(desc(products.soldCount))
      .limit(4);
    for (const r of rel) {
      const ri = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, r.id))
        .orderBy(asc(productImages.sortOrder))
        .limit(1);
      related.push({
        id: r.id,
        name: r.name,
        slug: r.slug,
        regularPrice: r.regularPrice,
        salePrice: r.salePrice,
        image: ri[0]?.imageUrl || null,
      });
    }
  }
  return { p, imgs, variants, category, related };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product Not Found" };
  const { p, imgs } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const title = p.metaTitle || p.name;
  const description = p.metaDescription || p.description?.slice(0, 160) || `Buy ${p.name} online in Bangladesh from RIFOI.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/product/${p.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/product/${p.slug}`,
      siteName: "RIFOI",
      images: imgs[0]?.imageUrl ? [{ url: imgs[0].imageUrl, alt: p.name }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { p, imgs, variants, category, related } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
  const models = [...new Set(variants.map((v) => v.model).filter(Boolean))] as string[];

  const detail = {
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
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku || undefined,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    description: p.description?.slice(0, 500) || p.name,
    image: imgs.map((i) => i.imageUrl),
    url: `${siteUrl}/product/${p.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: p.salePrice ?? p.regularPrice,
      availability:
        p.availabilityStatus === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-red-700">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-red-700">Shop</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/shop?category=${category.slug}`} className="hover:text-red-700">{category.name}</Link>
          </>
        )}
        <span>/</span>
        <span className="truncate font-semibold text-neutral-700">{p.name}</span>
      </nav>

      <ProductDetails product={detail} />

      {/* Tabs: description / specs / care / shipping */}
      <div className="mt-12 rounded-2xl border border-neutral-200/80 bg-white p-6 md:p-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-lg font-extrabold">Product Description</h2>
            <div className="rifoi-prose mt-3 text-sm text-neutral-600">
              {p.description || "Detailed description coming soon. WhatsApp us for more information about this product."}
            </div>
            {p.tags && (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">#{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            {p.specifications && (
              <div>
                <h3 className="font-display text-base font-extrabold">Specifications</h3>
                <div className="rifoi-prose mt-2 text-sm text-neutral-600">{p.specifications}</div>
              </div>
            )}
            {p.materialCare && (
              <div>
                <h3 className="font-display text-base font-extrabold">Material & Care</h3>
                <div className="rifoi-prose mt-2 text-sm text-neutral-600">{p.materialCare}</div>
              </div>
            )}
            <div>
              <h3 className="font-display text-base font-extrabold">Shipping & Returns</h3>
              <div className="rifoi-prose mt-2 text-sm text-neutral-600">
                {p.shippingInfo || "Delivery inside Dhaka in 1–2 days, outside Dhaka in 2–4 days."}
                {"\n"}
                {p.returnInfo || "7-day easy return support. See our Return & Refund Policy for details."}
              </div>
              <div className="mt-2 flex gap-4 text-xs font-bold">
                <Link href="/shipping-policy" className="text-red-700 hover:underline">Shipping Policy</Link>
                <Link href="/return-policy" className="text-red-700 hover:underline">Return Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <SectionHeader title="Related Products" subtitle="You may also like" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((r) => (
              <ProductCard
                key={r.id}
                product={{
                  id: r.id,
                  name: r.name,
                  slug: r.slug,
                  regularPrice: r.regularPrice,
                  salePrice: r.salePrice,
                  discountPercent:
                    r.salePrice && r.salePrice < r.regularPrice
                      ? Math.round(((r.regularPrice - r.salePrice) / r.regularPrice) * 100)
                      : 0,
                  image: r.image,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
