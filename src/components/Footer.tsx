"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useConfig, useToast } from "@/lib/store";

export default function Footer() {
  const { config } = useConfig();
  const { push } = useToast();
  const [cats, setCats] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [email, setEmail] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCats((d.categories || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      push("Subscribed successfully. Thank you!", "success");
      setEmail("");
    } catch (err) {
      push(err instanceof Error ? err.message : "Subscription failed", "error");
    } finally {
      setSubLoading(false);
    }
  };

  const wa = config?.whatsappUrl || "https://wa.me/8801312812139";
  const fb = config?.facebookUrl || "https://www.facebook.com/share/18MBugQQsA/";

  return (
    <footer className="bg-neutral-950 text-neutral-300">
      {/* Newsletter */}
      {config?.newsletterEnabled !== false && (
        <div className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
            <div className="text-center md:text-left">
              <h3 className="font-display text-lg font-bold text-white">Get offers & new arrivals</h3>
              <p className="mt-1 text-sm text-neutral-400">Join the RIFOI newsletter. No spam, unsubscribe anytime.</p>
            </div>
            <form onSubmit={subscribe} className="flex w-full max-w-md overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15 focus-within:ring-red-500">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-transparent px-5 py-3 text-sm text-white placeholder:text-neutral-500 outline-none"
                aria-label="Email address"
              />
              <button
                type="submit"
                disabled={subLoading}
                className="shrink-0 bg-red-700 px-6 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {subLoading ? "…" : "Subscribe"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            For your needs Rifoi — quality fashion, electronics, watches & everyday essentials delivered across Bangladesh.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href={fb}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#1877F2]"
              aria-label="Follow RIFOI on Facebook"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" /></svg>
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#25D366]"
              aria-label="Chat with RIFOI on WhatsApp"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3zm0 16.5a7.5 7.5 0 0 1-3.8-1l-.3-.2-2.8.7.7-2.7-.2-.3A7.5 7.5 0 1 1 12 19.5zm4.1-5.6c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.1 6.1 0 0 1-3-2.6c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.6c-.2-.4-.3-.4-.5-.4h-.5c-.2 0-.5.2-.7.6-.2.4-.9 2.2-.9 4.2 0 2 1.5 4 1.7 4.3.2.3 2.9 4.6 7.1 6.2 1 .4 1.7.6 2.3.8.9.3 1.8.3 2.5.2.8-.1 2.3-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.1-.3-.2-.5-.3z" /></svg>
            </a>
          </div>
        </div>

        <nav aria-label="Shop links">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/shop" className="hover:text-white">All Products</Link></li>
            {cats.map((c) => (
              <li key={c.id}><Link href={`/shop?category=${c.slug}`} className="hover:text-white">{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help links">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Help & Policies</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
            <li><Link href="/track-order" className="hover:text-white">Track Order</Link></li>
            <li><Link href="/shipping-policy" className="hover:text-white">Shipping Policy</Link></li>
            <li><Link href="/return-policy" className="hover:text-white">Return & Refund Policy</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
          </ul>
        </nav>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={`tel:${config?.supportPhone || "01312812139"}`} className="hover:text-white">
                Hotline: {config?.supportPhone || "01312812139"}
              </a>
            </li>
            <li>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp: {config?.whatsappLocal || "01312812139"}
              </a>
            </li>
            {config?.supportEmail && (
              <li>
                <a href={`mailto:${config.supportEmail}`} className="hover:text-white break-all">
                  {config.supportEmail}
                </a>
              </li>
            )}
            {config?.storeAddress && <li className="text-neutral-400">{config.storeAddress}</li>}
            <li className="text-neutral-400">Open daily: 9:00 AM – 11:00 PM</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {["bKash", "Nagad", "Rocket", "COD"].map((p) => (
              <span key={p} className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-neutral-500 md:flex-row">
          <p>© {new Date().getFullYear()} RIFOI. All rights reserved. For your needs Rifoi.</p>
          <p>Prices in Bangladeshi Taka (BDT ৳) • Cash on Delivery available</p>
        </div>
      </div>
    </footer>
  );
}
