"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { LoadingState } from "@/components/ui";

type Snapshot = {
  orderRef: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentStatus: string;
  name: string;
  phone: string;
  district: string;
  address: string;
  paymentMethod: string;
  items: { name: string; variant: string | null; qty: number; price: number }[];
  waUrl: string;
};

function SuccessInner() {
  const sp = useSearchParams();
  const ref = sp.get("ref") || "";
  const [order, setOrder] = useState<Snapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rifoi_last_order");
      if (raw) {
        const snap = JSON.parse(raw) as Snapshot;
        if (!ref || snap.orderRef === ref) setOrder(snap);
      }
    } catch {}
    setReady(true);
  }, [ref]);

  if (!ready) return <LoadingState text="Confirming your order…" />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-8 text-center md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg viewBox="0 0 24 24" className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold md:text-3xl">Thank You! Order Placed 🎉</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your order has been saved. Our team will contact you shortly to confirm.
        </p>
        {(order?.orderRef || ref) && (
          <div className="mx-auto mt-5 max-w-xs rounded-2xl bg-neutral-50 px-6 py-4 ring-1 ring-neutral-200">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Order Reference</p>
            <p className="mt-1 font-display text-xl font-extrabold text-neutral-900">{order?.orderRef || ref}</p>
            {order && <p className="mt-1 text-sm font-bold text-red-700">{formatPrice(order.total)} • {order.paymentMethod}</p>}
          </div>
        )}

        {order && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-left ring-1 ring-amber-200">
            <p className="text-sm font-bold text-amber-900">Confirm faster on WhatsApp (recommended)</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Tap the button below to open WhatsApp with your order details pre-filled. You must press <b>send</b> in
              WhatsApp — opening it does not send anything automatically. Our team verifies every order before confirmation.
            </p>
            <a
              href={order.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-xl bg-[#25D366] py-3 text-center text-sm font-extrabold text-white transition hover:brightness-95"
            >
              Send Order via WhatsApp
            </a>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white hover:bg-red-700">
            Track Your Order
          </Link>
          <Link href="/shop" className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-700 hover:border-neutral-400">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingState text="Confirming your order…" />}>
      <SuccessInner />
    </Suspense>
  );
}
