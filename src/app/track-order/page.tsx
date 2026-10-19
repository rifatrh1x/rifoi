"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];
const LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

type Tracked = {
  orderRef: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  district: string;
  createdAt: string;
  items: { name: string; variant: string | null; qty: number; unitPrice: number; total: number }[];
};

export default function TrackOrderPage() {
  const [ref, setRef] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Tracked | null>(null);

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    if (!ref.trim() || !phone.trim()) {
      setError("Enter your order reference and phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef: ref.trim(), phone: phone.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Order not found");
      setOrder(d.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = order ? STEPS.indexOf(order.status) : -1;
  const isFinalBad = order && (order.status === "cancelled" || order.status === "returned");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-center font-display text-2xl font-extrabold md:text-3xl">Track Your Order</h1>
      <p className="mt-1 text-center text-sm text-neutral-500">Enter the order reference you received at checkout.</p>

      <form onSubmit={track} className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-neutral-600">Order Reference *</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="RIF-2026XXXXX-XXXXX" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-neutral-600">Phone Number *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700" />
          </div>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="mt-4 w-full rounded-xl bg-neutral-900 py-3 text-sm font-extrabold text-white hover:bg-red-700 disabled:opacity-60">
          {loading ? "Tracking…" : "Track Order"}
        </button>
      </form>

      {order && (
        <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-6 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Order</p>
              <p className="font-display text-lg font-extrabold">{order.orderRef}</p>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-xs font-extrabold uppercase ${isFinalBad ? "bg-red-100 text-red-700" : order.status === "delivered" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
              {LABELS[order.status] || order.status}
            </span>
          </div>

          {!isFinalBad && stepIdx >= 0 && (
            <div className="mt-6">
              <div className="flex items-center">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= stepIdx ? "bg-red-700 text-white" : "bg-neutral-200 text-neutral-500"}`}>
                        {i < stepIdx ? "✓" : i + 1}
                      </span>
                      <span className="mt-1 hidden text-[10px] font-bold uppercase sm:block">{LABELS[s]}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`mx-1 mb-0 h-1 flex-1 rounded sm:mb-5 ${i < stepIdx ? "bg-red-700" : "bg-neutral-200"}`} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span className="text-neutral-600">{it.name}{it.variant ? ` (${it.variant})` : ""} × {it.qty}</span>
                <b>{formatPrice(it.total)}</b>
              </div>
            ))}
            <div className="flex justify-between border-t border-neutral-100 pt-2 text-neutral-600"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between text-neutral-600"><span>Delivery</span><span>{formatPrice(order.deliveryFee)}</span></div>
            <div className="flex justify-between text-base font-extrabold"><span>Total</span><span className="text-red-700">{formatPrice(order.total)}</span></div>
            <p className="pt-1 text-xs text-neutral-500">Payment: {order.paymentMethod} • Status: {order.paymentStatus.replace(/_/g, " ")} • District: {order.district}</p>
          </div>
        </div>
      )}
    </div>
  );
}
