import Link from "next/link";
import { db } from "@/db";
import { banners, categories, productImages, products } from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getSiteSettings } from "@/lib/settings";
import ProductCard from "@/components/ProductCard";
import { SectionHeader, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

type ProdRow = typeof products.$inferSelect;

async function withImages(rows: ProdRow[]) {
  const ids = rows.map((r) => r.id);
  const imgs = ids.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder))
    : [];
  const firstById: Record<string, string> = {};
  for (const im of imgs) {
    if (!firstById[im.productId]) firstById[im.productId] = im.imageUrl;
  }
  return { firstById };
}

function toCard(p: ProdRow, firstById: Record<string, string>) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    regularPrice: p.regularPrice,
    salePrice: p.salePrice,
    discountPercent:
      p.salePrice && p.salePrice < p.regularPrice
        ? Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100)
        : 0,
    image: firstById[p.id] || null,
    availabilityStatus: p.availabilityStatus,
    isNewArrival: p.isNewArrival,
    soldCount: p.soldCount,
  };
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  const waUrl = `https://wa.me/${settings.whatsappIntl}`;

  const [cats, heroBanners, promoBanners, offerBanners] = await Promise.all([
    db.select().from(categories).where(eq(categories.isPublished, true)).orderBy(asc(categories.sortOrder)).limit(12),
    db.select().from(banners).where(and(eq(banners.isActive, true), eq(banners.position, "hero"))).orderBy(asc(banners.sortOrder)).limit(3),
    db.select().from(banners).where(and(eq(banners.isActive, true), eq(banners.position, "promo"))).orderBy(asc(banners.sortOrder)).limit(4),
    db.select().from(banners).where(and(eq(banners.isActive, true), eq(banners.position, "offer"))).orderBy(asc(banners.sortOrder)).limit(2),
  ]);

  const counts = await db
    .select({ categoryId: products.categoryId, count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.status, "published"))
    .groupBy(products.categoryId);
  const countMap: Record<string, number> = {};
  for (const c of counts) if (c.categoryId) countMap[c.categoryId] = Number(c.count);

  const [newArrivals, featured, bestSellers, allRecent] = await Promise.all([
    db.select().from(products).where(and(eq(products.status, "published"), eq(products.isNewArrival, true))).orderBy(desc(products.createdAt)).limit(8),
    db.select().from(products).where(and(eq(products.status, "published"), eq(products.isFeatured, true))).orderBy(desc(products.createdAt)).limit(8),
    db.select().from(products).where(eq(products.status, "published")).orderBy(desc(products.soldCount)).limit(8),
    db.select().from(products).where(eq(products.status, "published")).orderBy(desc(products.createdAt)).limit(8),
  ]);

  const allProds = [...new Map([...newArrivals, ...featured, ...bestSellers, ...allRecent].map((p) => [p.id, p])).values()];
  const { firstById } = await withImages(allProds);
  const hasSales = bestSellers.some((p) => p.soldCount > 0);
  const totalPublished = allRecent.length;
  const hero = heroBanners[0];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-red-700 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-red-900 blur-3xl" />
        </div>
        {settings.heroImage || hero?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero?.imageUrl || settings.heroImage}
            alt="RIFOI featured collection"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-200 ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Trusted online shop in Bangladesh
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight md:text-6xl">
              {hero?.title || settings.heroTitle}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-300 md:text-lg">
              {hero?.subtitle || settings.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={hero?.ctaLink || settings.heroCtaLink || "/shop"}
                className="rounded-full bg-red-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-600"
              >
                {hero?.ctaText || settings.heroCtaText || "Shop Now"}
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 px-8 py-3.5 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20"
              >
                WhatsApp Us
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-neutral-300">
              <span className="flex items-center gap-2">✓ Cash on Delivery</span>
              <span className="flex items-center gap-2">✓ bKash / Nagad / Rocket</span>
              <span className="flex items-center gap-2">✓ All over Bangladesh</span>
            </div>
          </div>
          <div className="hidden md:block animate-fade-up-1">
            <div className="relative mx-auto max-w-md">
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-2 shadow-2xl backdrop-blur">
                {settings.heroImage || hero?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero?.imageUrl || settings.heroImage} alt="RIFOI hero" className="aspect-[4/5] w-full rounded-2xl object-cover" />
                ) : (
                  <div className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-red-800 via-neutral-900 to-neutral-950 p-8 text-center">
                    <svg viewBox="0 0 64 64" className="h-24 w-24" fill="none">
                      <circle cx="32" cy="32" r="29" stroke="#fff" strokeWidth="3" />
                      <text x="32" y="44" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="34" fill="#fff">R</text>
                    </svg>
                    <p className="mt-6 font-display text-3xl font-extrabold tracking-[0.2em]">RIFOI</p>
                    <p className="mt-2 text-sm text-neutral-300">For your needs Rifoi</p>
                    <p className="mt-6 max-w-xs text-xs leading-relaxed text-neutral-400">
                      Owner tip: upload a hero banner image from Admin → Banners to feature your latest collection here.
                    </p>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-5 -left-5 rounded-2xl bg-white px-5 py-4 text-neutral-900 shadow-xl">
                <p className="text-2xl font-extrabold text-red-700">৳</p>
                <p className="text-xs font-semibold text-neutral-500">Fair prices in BDT</p>
              </div>
              <div className="absolute -right-4 -top-5 rounded-2xl bg-white px-5 py-4 text-neutral-900 shadow-xl">
                <p className="text-2xl font-extrabold">COD</p>
                <p className="text-xs font-semibold text-neutral-500">Pay on delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-neutral-200/70 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 md:grid-cols-4">
          {[
            ["Fast Delivery", "Inside & outside Dhaka"],
            ["Cash on Delivery", "Pay at your doorstep"],
            ["WhatsApp Support", settings.whatsappLocal],
            ["Easy Returns", "7-day return support"],
          ].map(([t, s]) => (
            <div key={t} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <div>
                <p className="text-sm font-bold text-neutral-900">{t}</p>
                <p className="text-xs text-neutral-500">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader title="Shop by Category" subtitle="Find exactly what you need" href="/shop" />
        {cats.length === 0 ? (
          <EmptyState title="Categories coming soon" message="Our categories are being prepared. Please check back shortly." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {cats.map((c, i) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className={`group overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition hover:-translate-y-1 hover:shadow-lg animate-fade-up-${Math.min(i % 4, 3)}`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-3xl font-extrabold text-neutral-300">{c.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <p className="truncate text-sm font-bold text-neutral-900 group-hover:text-red-700">{c.name}</p>
                  <p className="text-xs text-neutral-500">{countMap[c.id] || 0} items</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <SectionHeader title="New Arrivals" subtitle="Fresh picks, just added" href="/shop?sort=newest" />
        {newArrivals.length === 0 ? (
          <EmptyState
            title="New products coming soon"
            message="We are adding new products to our store. Follow us on Facebook or WhatsApp us for updates."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={toCard(p, firstById)} />
            ))}
          </div>
        )}
      </section>

      {/* PROMO BANNERS */}
      {promoBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className={`grid gap-4 ${promoBanners.length > 1 ? "md:grid-cols-2" : ""}`}>
            {promoBanners.slice(0, 2).map((b) => (
              <div key={b.id} className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 text-white md:p-10">
                {b.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.title || "Promotion"} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                )}
                <div className="relative">
                  <h3 className="font-display text-2xl font-extrabold md:text-3xl">{b.title}</h3>
                  {b.subtitle && <p className="mt-2 max-w-md text-sm text-neutral-300">{b.subtitle}</p>}
                  {b.ctaText && b.ctaLink && (
                    <Link href={b.ctaLink} className="mt-5 inline-block rounded-full bg-red-700 px-6 py-2.5 text-sm font-bold transition hover:bg-red-600">
                      {b.ctaText}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BEST SELLERS (real order data) */}
      {hasSales && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <SectionHeader title="Best Sellers" subtitle="Loved by customers across Bangladesh" href="/shop?sort=popular" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={toCard(p, firstById)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeader title="Featured Products" subtitle="Handpicked quality by RIFOI" href="/shop" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={toCard(p, firstById)} />
            ))}
          </div>
        </section>
      )}

      {/* OFFER BANNER */}
      {offerBanners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          {offerBanners.slice(0, 1).map((b) => (
            <div key={b.id} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-800 via-red-700 to-neutral-900 p-8 text-center text-white md:p-12">
              {b.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.imageUrl} alt={b.title || "Offer"} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25" />
              )}
              <div className="relative">
                <h3 className="font-display text-2xl font-extrabold md:text-4xl">{b.title}</h3>
                {b.subtitle && <p className="mx-auto mt-3 max-w-xl text-sm text-red-100 md:text-base">{b.subtitle}</p>}
                {b.ctaText && b.ctaLink && (
                  <Link href={b.ctaLink} className="mt-6 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-red-800 transition hover:bg-red-50">
                    {b.ctaText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* EXPLORE ALL (fallback when sections empty) */}
      {totalPublished > 0 && newArrivals.length === 0 && featured.length === 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeader title="Explore Products" href="/shop" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {allRecent.map((p) => (
              <ProductCard key={p.id} product={toCard(p, firstById)} />
            ))}
          </div>
        </section>
      )}

      {/* WHY RIFOI */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-extrabold md:text-3xl">Why Shop With RIFOI?</h2>
            <p className="mt-2 text-sm text-neutral-500">For your needs Rifoi — quality you can trust</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Genuine Products", "Every item is quality-checked before dispatch so you receive exactly what you ordered."],
              ["Fair BDT Pricing", "Transparent prices in Bangladeshi Taka with no hidden charges at checkout."],
              ["Flexible Payments", "Pay with bKash, Nagad, Rocket or Cash on Delivery — your choice."],
              ["Dedicated Support", "Real human support on WhatsApp from 9 AM to 11 PM, every day."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-neutral-200/80 bg-[#faf7f2] p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-700 text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <h3 className="mt-4 font-bold text-neutral-900">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND + SUPPORT */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-neutral-950 p-8 text-white md:p-10">
            <h2 className="font-display text-2xl font-extrabold">About RIFOI</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              RIFOI is a premium online shopping destination in Bangladesh. From fashion and footwear to watches,
              electronics and everyday essentials — we bring quality products to your doorstep with cash on delivery
              and friendly customer care.
            </p>
            <Link href="/about" className="mt-5 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-red-50">
              Learn More
            </Link>
          </div>
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 md:p-10">
            <h2 className="font-display text-2xl font-extrabold text-neutral-900">Need Help? Contact Us</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              Questions about products, orders or delivery? Message us anytime — we usually reply within minutes during support hours.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-95">
                WhatsApp: {settings.whatsappLocal}
              </a>
              <Link href="/contact" className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">
                Contact Page
              </Link>
            </div>
            <p className="mt-4 text-xs text-neutral-400">Hotline: {settings.supportPhone} • {settings.supportEmail}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
