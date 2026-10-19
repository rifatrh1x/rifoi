"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { LoadingState, EmptyState } from "@/components/ui";
import { StatusPill } from "./AdminUI";

type Stats = {
  revenue: number;
  orders: number;
  pending: number;
  products: number;
  lowStock: number;
  unreadMessages: number;
  byStatus: { status: string; count: number }[];
  recentOrders: { id: string; orderRef: string; customerName: string; total: number; status: string; paymentStatus: string; createdAt: string }[];
  topProducts: { id: string; name: string; slug: string; soldCount: number; stockQuantity: number }[];
  last7days: { day: string; total: number; count: number }[];
};

export default function Overview({ go }: { go: (tab: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setStats(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState text="Loading dashboard…" />;
  if (!stats) return <EmptyState title="Could not load stats" message="Please refresh the page." />;

  const cards = [
    { label: "Total Revenue", value: formatPrice(stats.revenue), sub: "Excludes cancelled / returned", tab: "orders" },
    { label: "Total Orders", value: String(stats.orders), sub: `${stats.pending} pending`, tab: "orders" },
    { label: "Products", value: String(stats.products), sub: `${stats.lowStock} low stock (≤5)`, tab: "products" },
    { label: "Unread Messages", value: String(stats.unreadMessages), sub: "Contact enquiries", tab: "messages" },
  ];

  const maxDay = Math.max(1, ...stats.last7days.map((d) => d.total));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <button key={c.label} onClick={() => go(c.tab)} className="rounded-2xl border border-neutral-200/80 bg-white p-5 text-left transition hover:shadow-md">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold md:text-3xl">{c.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{c.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6">
          <h3 className="font-display text-base font-extrabold">Revenue — Last 7 Days</h3>
          {stats.last7days.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No orders in the last 7 days yet.</p>
          ) : (
            <div className="mt-4 flex h-40 items-end gap-2">
              {stats.last7days.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${formatPrice(d.total)} (${d.count} orders)`}>
                  <span className="text-[10px] font-bold text-neutral-500">{d.count > 0 ? formatPrice(d.total) : ""}</span>
                  <div
                    className="w-full rounded-t-lg bg-red-700/85"
                    style={{ height: `${Math.max(4, (d.total / maxDay) * 100)}%`, opacity: d.total > 0 ? 1 : 0.15 }}
                  />
                  <span className="text-[10px] font-semibold text-neutral-400">{d.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.byStatus.map((s) => (
              <span key={s.status} className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">
                <StatusPill status={s.status} /> × {s.count}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold">Top Selling Products</h3>
            <button onClick={() => go("products")} className="text-xs font-bold text-red-700 hover:underline">Manage →</button>
          </div>
          {stats.topProducts.length === 0 || stats.topProducts.every((p) => p.soldCount === 0) ? (
            <p className="mt-4 text-sm text-neutral-500">No sales yet. Top sellers will appear here from real order data.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {stats.topProducts.filter((p) => p.soldCount > 0).slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="clamp-1 font-semibold">{p.name}</span>
                  <span className="shrink-0 text-xs font-bold text-emerald-700">{p.soldCount} sold • {p.stockQuantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-extrabold">Recent Orders</h3>
          <button onClick={() => go("orders")} className="text-xs font-bold text-red-700 hover:underline">View all →</button>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No orders yet. New orders will appear here with customer and payment details.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-xs uppercase tracking-wider text-neutral-400">
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Payment</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-50">
                    <td className="py-2.5 pr-4 font-bold">{o.orderRef}</td>
                    <td className="py-2.5 pr-4">{o.customerName}</td>
                    <td className="py-2.5 pr-4 font-bold">{formatPrice(o.total)}</td>
                    <td className="py-2.5 pr-4"><StatusPill status={o.status} /></td>
                    <td className="py-2.5"><StatusPill status={o.paymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
