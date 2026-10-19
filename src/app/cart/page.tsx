"use client";

import Link from "next/link";
import { useCart, useConfig } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { ProductImage } from "@/components/ProductCard";

export default function CartPage() {
  const { items, subtotal, setQty, remove, clear, loaded } = useCart();
  const { config } = useConfig();

  if (!loaded) return null;
  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          title="Your cart is empty"
          message="Browse our products and add something you love. Cash on Delivery available all over Bangladesh."
          actionHref="/shop"
          actionText="Start Shopping"
        />
      </div>
    );
  }

  const threshold = config?.freeShippingThreshold || 0;
  const progress = threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold md:text-3xl">Shopping Cart ({items.length})</h1>
        <button onClick={clear} className="text-sm font-semibold text-red-700 hover:underline">
          Clear all
        </button>
      </div>

      {threshold > 0 && (
        <div className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-neutral-200/70">
          {subtotal >= threshold ? (
            <p className="text-sm font-bold text-emerald-700">🎉 You unlocked FREE delivery!</p>
          ) : (
            <p className="text-sm font-semibold text-neutral-700">
              Add {formatPrice(threshold - subtotal)} more to get FREE delivery
            </p>
          )}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {items.map((it) => (
            <div key={`${it.productId}-${it.variantId || "base"}`} className="flex gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4">
              <Link href={`/product/${it.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                <ProductImage src={it.image} alt={it.name} className="h-full w-full" />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link href={`/product/${it.slug}`} className="clamp-2 text-sm font-bold hover:text-red-700">
                  {it.name}
                </Link>
                {it.variantLabel && <p className="mt-0.5 text-xs text-neutral-500">{it.variantLabel}</p>}
                <p className="mt-1 text-sm font-extrabold">{formatPrice(it.unitPrice)}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-neutral-200">
                    <button onClick={() => setQty(it.productId, it.variantId, it.qty - 1)} className="px-3 py-1.5 font-bold" aria-label="Decrease">−</button>
                    <span className="w-8 text-center text-sm font-bold">{it.qty}</span>
                    <button onClick={() => setQty(it.productId, it.variantId, it.qty + 1)} className="px-3 py-1.5 font-bold" aria-label="Increase">+</button>
                  </div>
                  <button onClick={() => remove(it.productId, it.variantId)} className="text-xs font-bold text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
              <p className="hidden text-sm font-extrabold sm:block">{formatPrice(it.unitPrice * it.qty)}</p>
            </div>
          ))}
          <Link href="/shop" className="inline-block text-sm font-bold text-neutral-600 hover:text-red-700">
            ← Continue Shopping
          </Link>
        </div>

        <div className="h-fit rounded-2xl border border-neutral-200/80 bg-white p-6 lg:sticky lg:top-36">
          <h2 className="font-display text-lg font-extrabold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <b className="text-neutral-900">{formatPrice(subtotal)}</b>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Delivery fee</span>
              <span className="font-semibold">Calculated at checkout</span>
            </div>
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-extrabold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-5 block rounded-xl bg-red-700 py-3.5 text-center text-sm font-extrabold text-white transition hover:bg-red-600"
          >
            Proceed to Checkout
          </Link>
          <p className="mt-3 text-center text-xs text-neutral-500">
            Cash on Delivery • bKash • Nagad • Rocket
          </p>
        </div>
      </div>
    </div>
  );
}
