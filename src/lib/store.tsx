"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ---------------- Toast ----------------
type Toast = { id: number; message: string; kind: "success" | "error" | "info" };
const ToastCtx = createContext<{ push: (message: string, kind?: Toast["kind"]) => void }>({
  push: () => {},
});
export const useToast = () => useContext(ToastCtx);

function ToastHost({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-20 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`w-full rounded-xl px-4 py-3 text-center text-sm font-medium shadow-xl animate-fade-up ${
            t.kind === "success"
              ? "bg-emerald-600 text-white"
              : t.kind === "error"
                ? "bg-red-600 text-white"
                : "bg-neutral-900 text-white"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ---------------- Cart ----------------
export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  variantId: string | null;
  variantLabel: string | null;
  unitPrice: number;
  qty: number;
};

type CartCtxType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  clear: () => void;
  loaded: boolean;
};

const CartCtx = createContext<CartCtxType>({
  items: [],
  count: 0,
  subtotal: 0,
  add: () => {},
  remove: () => {},
  setQty: () => {},
  clear: () => {},
  loaded: false,
});
export const useCart = () => useContext(CartCtx);

// ---------------- Wishlist ----------------
type WishCtxType = {
  slugs: string[];
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
  loaded: boolean;
};
const WishCtx = createContext<WishCtxType>({ slugs: [], toggle: () => {}, has: () => false, loaded: false });
export const useWishlist = () => useContext(WishCtx);

// ---------------- Site config ----------------
export type SiteConfigPublic = {
  announcement: string;
  whatsappLocal: string;
  whatsappIntl: string;
  whatsappUrl: string;
  facebookUrl: string;
  supportPhone: string;
  supportEmail: string;
  storeAddress: string;
  deliveryDhaka: number;
  deliveryOutside: number;
  freeShippingThreshold: number;
  payments: {
    bkash: { enabled: boolean; number: string; instructions: string };
    nagad: { enabled: boolean; number: string; instructions: string };
    rocket: { enabled: boolean; number: string; instructions: string };
    cod: { enabled: boolean; instructions: string };
  };
  logoUrl: string;
  hero: { title: string; subtitle: string; ctaText: string; ctaLink: string; image: string };
  newsletterEnabled: boolean;
};

const ConfigCtx = createContext<{ config: SiteConfigPublic | null }>({ config: null });
export const useConfig = () => useContext(ConfigCtx);

// ---------------- Provider ----------------
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [wishLoaded, setWishLoaded] = useState(false);
  const [config, setConfig] = useState<SiteConfigPublic | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const push = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rifoi_cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setCartLoaded(true);
    try {
      const raw = localStorage.getItem("rifoi_wishlist");
      if (raw) setSlugs(JSON.parse(raw));
    } catch {}
    setWishLoaded(true);
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setConfig(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (cartLoaded) {
      try {
        localStorage.setItem("rifoi_cart", JSON.stringify(items));
      } catch {}
    }
  }, [items, cartLoaded]);

  useEffect(() => {
    if (wishLoaded) {
      try {
        localStorage.setItem("rifoi_wishlist", JSON.stringify(slugs));
      } catch {}
    }
  }, [slugs, wishLoaded]);

  const add = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      setItems((prev) => {
        const idx = prev.findIndex(
          (p) => p.productId === item.productId && (p.variantId || null) === (item.variantId || null)
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: Math.min(50, next[idx].qty + qty) };
          return next;
        }
        return [...prev, { ...item, qty: Math.min(50, qty) }];
      });
      push("Added to cart", "success");
    },
    [push]
  );

  const remove = useCallback((productId: string, variantId: string | null) => {
    setItems((prev) =>
      prev.filter((p) => !(p.productId === productId && (p.variantId || null) === (variantId || null)))
    );
  }, []);

  const setQty = useCallback(
    (productId: string, variantId: string | null, qty: number) => {
      if (qty < 1) {
        remove(productId, variantId);
        return;
      }
      setItems((prev) =>
        prev.map((p) =>
          p.productId === productId && (p.variantId || null) === (variantId || null)
            ? { ...p, qty: Math.min(50, qty) }
            : p
        )
      );
    },
    [remove]
  );

  const clear = useCallback(() => setItems([]), []);

  const toggle = useCallback(
    (slug: string) => {
      setSlugs((prev) => {
        if (prev.includes(slug)) return prev.filter((s) => s !== slug);
        push("Added to wishlist", "success");
        return [...prev, slug];
      });
    },
    [push]
  );

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const { count, subtotal } = useMemo(() => {
    return {
      count: items.reduce((a, i) => a + i.qty, 0),
      subtotal: items.reduce((a, i) => a + i.qty * i.unitPrice, 0),
    };
  }, [items]);

  return (
    <ToastCtx.Provider value={{ push }}>
      <CartCtx.Provider value={{ items, count, subtotal, add, remove, setQty, clear, loaded: cartLoaded }}>
        <WishCtx.Provider value={{ slugs, toggle, has, loaded: wishLoaded }}>
          <ConfigCtx.Provider value={{ config }}>
            {children}
            <ToastHost toasts={toasts} />
          </ConfigCtx.Provider>
        </WishCtx.Provider>
      </CartCtx.Provider>
    </ToastCtx.Provider>
  );
}
