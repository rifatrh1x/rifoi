"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, useWishlist } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export type CardProduct = {
  id: string;
  name: string;
  slug: string;
  regularPrice: number;
  salePrice: number | null;
  effectivePrice?: number;
  discountPercent?: number;
  image: string | null;
  availabilityStatus?: string;
  isNewArrival?: boolean;
  soldCount?: number;
};

export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`flex flex-col items-center justify-center bg-neutral-100 text-neutral-400 ${className}`}>
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M4 18l5-5 3 3 3-3 5 5" />
        </svg>
        <span className="mt-2 px-3 text-center text-[10px] font-medium uppercase tracking-wider">
          Photo coming soon
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={`object-cover ${className}`} />;
}

export default function ProductCard({ product }: { product: CardProduct }) {
  const { toggle, has } = useWishlist();
  const { add } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const wished = has(product.slug);
  const outOfStock = product.availabilityStatus === "out_of_stock";
  const discount = product.discountPercent ?? 0;

  const quickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/products/${product.slug}`);
      const d = await res.json();
      if (d.product?.hasVariants) {
        router.push(`/product/${product.slug}`);
        return;
      }
      add({
        productId: d.product.id,
        slug: d.product.slug,
        name: d.product.name,
        image: d.product.images?.[0]?.url || product.image,
        variantId: null,
        variantLabel: null,
        unitPrice: d.product.effectivePrice,
      });
    } catch {
      router.push(`/product/${product.slug}`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-900/10">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-neutral-100">
        <div className="h-full w-full transition duration-500 group-hover:scale-105">
          <ProductImage src={product.image} alt={product.name} className="h-full w-full" />
        </div>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-bold text-white">-{discount}%</span>
          )}
          {product.isNewArrival && (
            <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-bold text-white">New</span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-neutral-500 px-2.5 py-1 text-[11px] font-bold text-white">Out of Stock</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(product.slug);
          }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition ${
            wished ? "bg-red-700 text-white" : "bg-white/95 text-neutral-600 hover:text-red-700"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 h-[18px] w-[18px]" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M12 20.5C7 16.5 3 13.3 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 4-4 7.2-9 11.2z" />
          </svg>
        </button>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${product.slug}`} className="clamp-2 min-h-10 text-sm font-semibold leading-snug text-neutral-900 hover:text-red-700">
          {product.name}
        </Link>
        {(product.soldCount ?? 0) > 0 && (
          <p className="mt-1 text-[11px] font-medium text-emerald-700">{product.soldCount} sold</p>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-neutral-900">
            {formatPrice(product.salePrice ?? product.regularPrice)}
          </span>
          {product.salePrice != null && product.salePrice < product.regularPrice && (
            <span className="text-xs text-neutral-400 line-through">{formatPrice(product.regularPrice)}</span>
          )}
        </div>
        <button
          onClick={quickAdd}
          disabled={adding || outOfStock}
          className={`mt-3 w-full rounded-xl py-2.5 text-sm font-bold transition ${
            outOfStock
              ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
              : "bg-neutral-900 text-white hover:bg-red-700"
          } disabled:opacity-70`}
        >
          {outOfStock ? "Out of Stock" : adding ? "Adding…" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
