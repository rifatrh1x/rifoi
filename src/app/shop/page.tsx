"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard, { CardProduct } from "@/components/ProductCard";
import { EmptyState, LoadingState, SkeletonCard } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

type Category = { id: string; name: string; slug: string; productCount: number };

function ShopInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Category[]>([]);
  const [filters, setFilters] = useState<{ sizes: string[]; colors: string[]; brands: string[]; priceRange: { min: number; max: number } }>({
    sizes: [],
    colors: [],
    brands: [],
    priceRange: { min: 0, max: 100000 },
  });
  const [showFilters, setShowFilters] = useState(false);

  const q = sp.get("q") || "";
  const category = sp.get("category") || "";
  const sort = sp.get("sort") || "newest";
  const page = Number(sp.get("page")) || 1;
  const min = sp.get("min") || "";
  const max = sp.get("max") || "";
  const size = sp.get("size") || "";
  const color = sp.get("color") || "";
  const brand = sp.get("brand") || "";
  const availability = sp.get("availability") || "";

  const setParam = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      if (!("page" in patch)) params.delete("page");
      router.push(`/shop?${params.toString()}`);
    },
    [sp, router]
  );

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories || [])).catch(() => {});
    fetch("/api/filters").then((r) => r.json()).then((d) => {
      if (d.sizes) setFilters(d);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(sp.toString());
    params.set("limit", "12");
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sp]);

  const hasFilters = useMemo(
    () => !!(q || category || min || max || size || color || brand || availability),
    [q, category, min, max, size, color, brand, availability]
  );

  const activeCat = cats.find((c) => c.slug === category);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Category</h4>
        <div className="space-y-1">
          <button
            onClick={() => setParam({ category: null })}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!category ? "bg-neutral-900 font-bold text-white" : "hover:bg-neutral-100"}`}
          >
            All Categories
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam({ category: c.slug })}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${category === c.slug ? "bg-neutral-900 font-bold text-white" : "hover:bg-neutral-100"}`}
            >
              <span>{c.name}</span>
              <span className="text-xs opacity-60">({c.productCount})</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Price Range (BDT)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder={String(filters.priceRange.min)}
            defaultValue={min}
            key={`min-${min}`}
            onBlur={(e) => setParam({ min: e.target.value || null })}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-red-700"
            aria-label="Minimum price"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="number"
            min={0}
            placeholder={String(filters.priceRange.max)}
            defaultValue={max}
            key={`max-${max}`}
            onBlur={(e) => setParam({ max: e.target.value || null })}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-red-700"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {filters.sizes.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Size</h4>
          <div className="flex flex-wrap gap-2">
            {filters.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setParam({ size: size === s ? null : s })}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${size === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {filters.colors.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Color</h4>
          <div className="flex flex-wrap gap-2">
            {filters.colors.map((c) => (
              <button
                key={c}
                onClick={() => setParam({ color: color === c ? null : c })}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${color === c ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {filters.brands.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Brand</h4>
          <div className="space-y-1">
            {filters.brands.map((b) => (
              <button
                key={b}
                onClick={() => setParam({ brand: brand === b ? null : b })}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${brand === b ? "bg-neutral-100 font-bold" : "hover:bg-neutral-50"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Availability</h4>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={availability === "in_stock"}
            onChange={(e) => setParam({ availability: e.target.checked ? "in_stock" : null })}
            className="h-4 w-4 accent-red-700"
          />
          In stock only
        </label>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.push("/shop")}
          className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold md:text-3xl">
          {activeCat ? activeCat.name : q ? `Results for "${q}"` : "Shop All Products"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {total} product{total === 1 ? "" : "s"} • Prices in BDT (৳)
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" /></svg>
          Filters
        </button>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="hidden text-sm text-neutral-500 sm:block">Sort by:</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setParam({ sort: e.target.value })}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-red-700"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popular">Popularity</option>
          </select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-36 rounded-2xl border border-neutral-200/80 bg-white p-5">{filterPanel}</div>
        </aside>

        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-bold">Done</button>
              </div>
              {filterPanel}
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              message="Try different keywords or reset the filters to browse everything."
              actionHref="/shop"
              actionText="Reset Filters"
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setParam({ page: String(page - 1) })}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <span className="px-2 text-sm font-semibold text-neutral-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setParam({ page: String(page + 1) })}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<LoadingState text="Loading shop…" />}>
      <ShopInner />
    </Suspense>
  );
}
