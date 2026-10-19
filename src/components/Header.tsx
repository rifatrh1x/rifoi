"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useCart, useConfig, useWishlist } from "@/lib/store";

type Category = { id: string; name: string; slug: string };

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

export default function Header() {
  const { count } = useCart();
  const { slugs } = useWishlist();
  const { config } = useConfig();
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCats(d.categories || []))
      .catch(() => {});
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
    setMobileSearch(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50">
      {config?.announcement ? (
        <div className="bg-neutral-900 text-white">
          <p className="mx-auto max-w-7xl truncate px-4 py-1.5 text-center text-[11px] font-medium tracking-wide md:text-xs">
            {config.announcement}
          </p>
        </div>
      ) : null}

      <div className="border-b border-neutral-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-6">
          {/* Mobile menu button */}
          <button
            className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>

          <Logo />

          {/* Desktop search */}
          <form onSubmit={submitSearch} className="mx-auto hidden max-w-xl flex-1 md:flex" role="search">
            <div className="flex w-full overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 focus-within:border-red-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands, categories…"
                className="w-full bg-transparent px-5 py-2.5 text-sm outline-none"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="bg-neutral-900 px-5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Search
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
            <button
              className="rounded-full p-2.5 text-neutral-700 hover:bg-neutral-100 md:hidden"
              onClick={() => setMobileSearch(!mobileSearch)}
              aria-label="Search"
            >
              <Icon d="M11 4a7 7 0 1 0 4.9 12L20 20l-1.4 1.4-4.1-4.1A7 7 0 0 0 11 4z" />
            </button>
            <Link href="/track-order" className="hidden rounded-full p-2.5 text-neutral-700 hover:bg-neutral-100 md:block" aria-label="Track order" title="Track Order">
              <Icon d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
            </Link>
            <Link href="/wishlist" className="relative rounded-full p-2.5 text-neutral-700 hover:bg-neutral-100" aria-label="Wishlist">
              <Icon d="M12 20.5C7 16.5 3 13.3 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 4-4 7.2-9 11.2z" />
              {slugs.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-bold text-white">
                  {slugs.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              aria-label="Shopping cart"
            >
              <Icon d="M3 4h2l2.4 12.2A1 1 0 0 0 8.4 17H18a1 1 0 0 0 1-0.8L21 8H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-neutral-900">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search row */}
        {mobileSearch && (
          <div className="border-t border-neutral-100 px-4 py-2 md:hidden">
            <form onSubmit={submitSearch} className="flex overflow-hidden rounded-full border border-neutral-200 bg-neutral-50" role="search">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent px-4 py-2.5 text-sm outline-none"
                aria-label="Search products"
                autoFocus
              />
              <button type="submit" className="bg-neutral-900 px-4 text-sm font-semibold text-white">
                Go
              </button>
            </form>
          </div>
        )}

        {/* Desktop nav */}
        <nav className="hidden border-t border-neutral-100 lg:block" aria-label="Main navigation">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 no-scrollbar">
            <Link href="/" className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-neutral-800 hover:text-red-700">Home</Link>
            <Link href="/shop" className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-neutral-800 hover:text-red-700">Shop All</Link>
            {cats.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-red-700"
              >
                {c.name}
              </Link>
            ))}
            <Link href="/track-order" className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-red-700">Track Order</Link>
            <Link href="/contact" className="whitespace-nowrap px-3 py-2.5 text-sm font-medium text-neutral-600 hover:text-red-700">Contact</Link>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between border-b border-neutral-100 p-4">
              <Logo compact />
              <button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 hover:bg-neutral-100" aria-label="Close menu">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
              <Link href="/" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-neutral-50">Home</Link>
              <Link href="/shop" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-neutral-50">Shop All</Link>
              <p className="mb-1 mt-4 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Categories</p>
              {cats.map((c) => (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  {c.name}
                </Link>
              ))}
              <p className="mb-1 mt-4 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Help</p>
              <Link href="/track-order" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Track Order</Link>
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Wishlist</Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Contact Us</Link>
              <Link href="/faq" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">FAQ</Link>
            </nav>
            <div className="border-t border-neutral-100 p-4">
              <a
                href={config?.whatsappUrl || "https://wa.me/8801312812139"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white"
              >
                WhatsApp: {config?.whatsappLocal || "01312812139"}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
