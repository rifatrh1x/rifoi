"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import Overview from "./Overview";
import ProductsAdmin from "./ProductsAdmin";
import CategoriesAdmin from "./CategoriesAdmin";
import OrdersAdmin from "./OrdersAdmin";
import CouponsAdmin from "./CouponsAdmin";
import BannersAdmin from "./BannersAdmin";
import ShippingAdmin from "./ShippingAdmin";
import PagesAdmin from "./PagesAdmin";
import MessagesAdmin from "./MessagesAdmin";
import SettingsAdmin from "./SettingsAdmin";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "orders", label: "Orders" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "banners", label: "Banners & Homepage" },
  { key: "coupons", label: "Coupons" },
  { key: "shipping", label: "Shipping" },
  { key: "pages", label: "Pages & Policies" },
  { key: "messages", label: "Messages" },
  { key: "settings", label: "Settings & Payments" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminShell({ user }: { user: { name: string; email: string } }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-6 md:px-6">
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <LogoMark size={38} />
          <div>
            <p className="font-display text-base font-extrabold leading-none">RIFOI Admin</p>
            <p className="mt-1 text-xs text-neutral-500">Signed in as {user.name} ({user.email})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank" className="hidden rounded-xl border border-neutral-200 px-4 py-2 text-xs font-bold hover:border-neutral-400 sm:block">
            View Store ↗
          </Link>
          <button onClick={logout} className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">
            Logout
          </button>
          <button onClick={() => setMobileNav(!mobileNav)} className="rounded-xl border border-neutral-200 p-2 lg:hidden" aria-label="Admin menu">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className={`lg:block ${mobileNav ? "block" : "hidden"}`}>
          <nav className="space-y-1 rounded-2xl border border-neutral-200/80 bg-white p-3 lg:sticky lg:top-36">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setMobileNav(false);
                  window.scrollTo({ top: 0 });
                }}
                className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition ${
                  tab === t.key ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {tab === "overview" && <Overview go={(t) => setTab(t as TabKey)} />}
          {tab === "orders" && <OrdersAdmin />}
          {tab === "products" && <ProductsAdmin />}
          {tab === "categories" && <CategoriesAdmin />}
          {tab === "banners" && <BannersAdmin />}
          {tab === "coupons" && <CouponsAdmin />}
          {tab === "shipping" && <ShippingAdmin />}
          {tab === "pages" && <PagesAdmin />}
          {tab === "messages" && <MessagesAdmin />}
          {tab === "settings" && <SettingsAdmin />}
        </div>
      </div>
    </div>
  );
}
