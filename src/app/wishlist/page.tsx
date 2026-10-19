"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/store";
import ProductCard, { CardProduct } from "@/components/ProductCard";
import { EmptyState, SkeletonCard } from "@/components/ui";

export default function WishlistPage() {
  const { slugs, loaded } = useWishlist();
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    if (!slugs.length) {
      setLoading(false);
      setProducts([]);
      return;
    }
    setLoading(true);
    Promise.all(
      slugs.map((s) => fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
    ).then((results) => {
      const list: CardProduct[] = [];
      for (const r of results) {
        if (r?.product) {
          const p = r.product;
          list.push({
            id: p.id,
            name: p.name,
            slug: p.slug,
            regularPrice: p.regularPrice,
            salePrice: p.salePrice,
            discountPercent: p.discountPercent,
            image: p.images?.[0]?.url || null,
            availabilityStatus: p.availabilityStatus,
          });
        }
      }
      setProducts(list);
      setLoading(false);
    });
  }, [slugs, loaded]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">My Wishlist</h1>
      <p className="mt-1 text-sm text-neutral-500">{slugs.length} saved item{slugs.length === 1 ? "" : "s"}</p>
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !products.length ? (
          <EmptyState
            title="Wishlist is empty"
            message="Tap the heart icon on any product to save it here for later."
            actionHref="/shop"
            actionText="Discover Products"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
