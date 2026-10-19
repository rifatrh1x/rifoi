"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, useConfig, useToast, useWishlist } from "@/lib/store";
import { formatPrice, whatsappEnquiryUrl } from "@/lib/utils";
import { ProductImage } from "./ProductCard";

export type DetailProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  description: string | null;
  specifications: string | null;
  materialCare: string | null;
  regularPrice: number;
  salePrice: number | null;
  effectivePrice: number;
  discountPercent: number;
  stockQuantity: number;
  availabilityStatus: string;
  tags: string | null;
  shippingInfo: string | null;
  returnInfo: string | null;
  videoUrl: string | null;
  soldCount: number;
  category: { id: string; name: string; slug: string } | null;
  images: { id: string; url: string; alt: string | null; isMain: boolean }[];
  variants: {
    id: string;
    size: string | null;
    color: string | null;
    model: string | null;
    priceOverride: number | null;
    stockQuantity: number;
    sku: string | null;
    isAvailable: boolean;
  }[];
  sizes: string[];
  colors: string[];
  models: string[];
  hasVariants: boolean;
};

export default function ProductDetails({ product }: { product: DetailProduct }) {
  const { add } = useCart();
  const { toggle, has } = useWishlist();
  const { config } = useConfig();
  const { push } = useToast();
  const router = useRouter();

  const [activeImg, setActiveImg] = useState(0);
  const [selSize, setSelSize] = useState<string | null>(null);
  const [selColor, setSelColor] = useState<string | null>(null);
  const [selModel, setSelModel] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "specs" | "care" | "shipping">("desc");

  const wished = has(product.slug);

  const matchedVariant = useMemo(() => {
    if (!product.hasVariants) return null;
    const cands = product.variants.filter((v) => {
      if (product.sizes.length && selSize && v.size !== selSize) return false;
      if (product.colors.length && selColor && v.color !== selColor) return false;
      if (product.models.length && selModel && v.model !== selModel) return false;
      return true;
    });
    if (cands.length === 1) return cands[0];
    // exact match when all required dims chosen
    const needSize = product.sizes.length > 0;
    const needColor = product.colors.length > 0;
    const needModel = product.models.length > 0;
    if (needSize && !selSize) return null;
    if (needColor && !selColor) return null;
    if (needModel && !selModel) return null;
    return cands.find((v) => v.isAvailable) || cands[0] || null;
  }, [product, selSize, selColor, selModel]);

  const unitPrice = matchedVariant?.priceOverride ?? product.effectivePrice;
  const availableStock = product.hasVariants
    ? (matchedVariant ? matchedVariant.stockQuantity : 0)
    : product.stockQuantity;
  const isOut = product.availabilityStatus === "out_of_stock" || availableStock <= 0;
  const variantChosen = !product.hasVariants || !!matchedVariant;

  const requireSelection = (): boolean => {
    if (!product.hasVariants) return true;
    const missing: string[] = [];
    if (product.sizes.length && !selSize) missing.push("size");
    if (product.colors.length && !selColor) missing.push("color");
    if (product.models.length && !selModel) missing.push("model");
    if (missing.length) {
      push(`Please select ${missing.join(", ")} first`, "error");
      return false;
    }
    if (matchedVariant && !matchedVariant.isAvailable) {
      push("This combination is unavailable. Please choose another.", "error");
      return false;
    }
    if (!matchedVariant) {
      push("This combination is unavailable. Please choose another.", "error");
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (isOut) {
      push("This product is out of stock", "error");
      return;
    }
    if (!requireSelection()) return;
    const bits = [matchedVariant?.size, matchedVariant?.color, matchedVariant?.model].filter(Boolean);
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url || null,
        variantId: matchedVariant?.id || null,
        variantLabel: bits.length ? bits.join(" / ") : null,
        unitPrice,
      },
      qty
    );
  };

  const handleBuyNow = () => {
    if (isOut) {
      push("This product is out of stock", "error");
      return;
    }
    if (!requireSelection()) return;
    const bits = [matchedVariant?.size, matchedVariant?.color, matchedVariant?.model].filter(Boolean);
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0]?.url || null,
        variantId: matchedVariant?.id || null,
        variantLabel: bits.length ? bits.join(" / ") : null,
        unitPrice,
      },
      qty
    );
    router.push("/checkout");
  };

  const waUrl = whatsappEnquiryUrl({
    productName: product.name,
    productUrl: typeof window !== "undefined" ? window.location.href : `/product/${product.slug}`,
    size: selSize || undefined,
    color: selColor || undefined,
    model: selModel || undefined,
    base: config?.whatsappUrl,
  });

  const share = async (network: "facebook" | "whatsapp" | "copy") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (network === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        push("Product link copied", "success");
      } catch {
        push("Could not copy link", "error");
      }
      return;
    }
    const shareUrl =
      network === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        : `${config?.whatsappUrl || "https://wa.me/8801312812139"}?text=${encodeURIComponent(`${product.name} ${url}`)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const mainImage = product.images[activeImg]?.url || product.images[0]?.url || null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="zoom-container relative aspect-square overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
          <ProductImage src={mainImage} alt={product.name} className="h-full w-full" />
          {product.discountPercent > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-red-700 px-3 py-1 text-xs font-bold text-white">
              -{product.discountPercent}% OFF
            </span>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {product.images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveImg(i)}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${i === activeImg ? "border-red-700" : "border-transparent ring-1 ring-neutral-200"}`}
                aria-label={`View image ${i + 1}`}
              >
                <ProductImage src={img.url} alt={`${product.name} ${i + 1}`} className="h-full w-full" />
              </button>
            ))}
          </div>
        )}
        {product.videoUrl && (
          <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-xl bg-neutral-900 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-red-700">
            ▶ Watch Product Video
          </a>
        )}
      </div>

      {/* Info */}
      <div>
        {product.category && (
          <Link href={`/shop?category=${product.category.slug}`} className="text-xs font-bold uppercase tracking-wider text-red-700 hover:underline">
            {product.category.name}
          </Link>
        )}
        <h1 className="mt-2 font-display text-2xl font-extrabold leading-snug md:text-3xl">{product.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
          {product.sku && <span>SKU: <b className="text-neutral-700">{product.sku}</b></span>}
          {product.brand && <span>Brand: <b className="text-neutral-700">{product.brand}</b></span>}
          {product.soldCount > 0 && <span className="font-semibold text-emerald-700">{product.soldCount} sold</span>}
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-extrabold text-neutral-900">{formatPrice(unitPrice)}</span>
          {product.salePrice != null && product.salePrice < product.regularPrice && (
            <span className="text-lg text-neutral-400 line-through">{formatPrice(product.regularPrice)}</span>
          )}
        </div>

        <p className={`mt-2 text-sm font-bold ${isOut ? "text-red-600" : "text-emerald-700"}`}>
          {isOut ? "● Out of Stock" : product.hasVariants && !matchedVariant ? "● Select options to check stock" : `● In Stock (${availableStock} available)`}
        </p>

        {/* Variant selectors */}
        {product.sizes.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-bold">Size: {selSize && <span className="text-red-700">{selSize}</span>}</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelSize(selSize === s ? null : s)}
                  className={`min-w-12 rounded-xl border px-4 py-2.5 text-sm font-bold ${selSize === s ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {product.colors.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold">Color: {selColor && <span className="text-red-700">{selColor}</span>}</p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelColor(selColor === c ? null : c)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${selColor === c ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
        {product.models.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold">Model: {selModel && <span className="text-red-700">{selModel}</span>}</p>
            <div className="flex flex-wrap gap-2">
              {product.models.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelModel(selModel === m ? null : m)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${selModel === m ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white hover:border-neutral-400"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Qty + actions */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-neutral-200 bg-white">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 text-lg font-bold" aria-label="Decrease quantity">−</button>
            <span className="w-8 text-center text-sm font-bold">{qty}</span>
            <button onClick={() => setQty(Math.min(50, qty + 1))} className="px-4 py-3 text-lg font-bold" aria-label="Increase quantity">+</button>
          </div>
          <button
            onClick={() => toggle(product.slug)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border ${wished ? "border-red-700 bg-red-50 text-red-700" : "border-neutral-200 bg-white text-neutral-500"}`}
            aria-label="Toggle wishlist"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wished ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M12 20.5C7 16.5 3 13.3 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 4-4 7.2-9 11.2z" />
            </svg>
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            onClick={handleAdd}
            disabled={isOut}
            className="rounded-xl border-2 border-neutral-900 bg-white py-3.5 text-sm font-extrabold text-neutral-900 transition hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOut}
            className="rounded-xl bg-red-700 py-3.5 text-sm font-extrabold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Buy Now
          </button>
        </div>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-extrabold text-white transition hover:brightness-95"
        >
          Enquire on WhatsApp
        </a>

        {/* Share */}
        <div className="mt-5 flex items-center gap-2 border-t border-neutral-200 pt-5">
          <span className="text-sm font-semibold text-neutral-500">Share:</span>
          <button onClick={() => share("facebook")} className="rounded-lg bg-[#1877F2] px-4 py-2 text-xs font-bold text-white">Facebook</button>
          <button onClick={() => share("whatsapp")} className="rounded-lg bg-[#25D366] px-4 py-2 text-xs font-bold text-white">WhatsApp</button>
          <button onClick={() => share("copy")} className="rounded-lg bg-neutral-200 px-4 py-2 text-xs font-bold text-neutral-700">Copy Link</button>
        </div>

        {/* Shipping / return quick info */}
        <div className="mt-5 space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-neutral-200/70">
          <p><b>Delivery:</b> Inside Dhaka ৳{config?.deliveryDhaka ?? 60} • Outside Dhaka ৳{config?.deliveryOutside ?? 120}</p>
          <p><b>Payment:</b> bKash, Nagad, Rocket & Cash on Delivery</p>
          <p><b>Return:</b> 7-day easy return support (see Return Policy)</p>
        </div>
      </div>
    </div>
  );
}
