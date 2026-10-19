"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, useConfig, useToast } from "@/lib/store";
import { BD_DISTRICTS, formatPrice, orderWhatsAppUrl } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { ProductImage } from "@/components/ProductCard";

type Method = "bkash" | "nagad" | "rocket" | "cod";

export default function CheckoutPage() {
  const { items, subtotal, clear, loaded } = useCart();
  const { config } = useConfig();
  const { push } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [method, setMethod] = useState<Method>("cod");
  const [trxId, setTrxId] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [placing, setPlacing] = useState(false);

  const enabledMethods = useMemo(() => {
    if (!config) return ["cod"] as Method[];
    const list: Method[] = [];
    if (config.payments.bkash.enabled) list.push("bkash");
    if (config.payments.nagad.enabled) list.push("nagad");
    if (config.payments.rocket.enabled) list.push("rocket");
    if (config.payments.cod.enabled) list.push("cod");
    return list.length ? list : (["cod"] as Method[]);
  }, [config]);

  const activeMethod: Method = enabledMethods.includes(method) ? method : enabledMethods[0];

  const deliveryFee = useMemo(() => {
    if (!config) return 0;
    const isDhaka = /dhaka/i.test(district);
    let fee = isDhaka ? config.deliveryDhaka : config.deliveryOutside;
    if (config.freeShippingThreshold > 0 && subtotal - (couponApplied?.discount || 0) >= config.freeShippingThreshold) {
      fee = 0;
    }
    return fee;
  }, [config, district, subtotal, couponApplied]);

  const discount = couponApplied?.discount || 0;
  const total = subtotal - discount + deliveryFee;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.trim(), subtotal }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Invalid coupon");
      setCouponApplied({ code: d.code, discount: d.discount });
      push(`Coupon applied: −${formatPrice(d.discount)}`, "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "Invalid coupon", "error");
    }
  };

  const methodMeta: Record<Method, { label: string; number?: string; instructions?: string }> = {
    bkash: { label: "bKash", number: config?.payments.bkash.number, instructions: config?.payments.bkash.instructions },
    nagad: { label: "Nagad", number: config?.payments.nagad.number, instructions: config?.payments.nagad.instructions },
    rocket: { label: "Rocket", number: config?.payments.rocket.number, instructions: config?.payments.rocket.instructions },
    cod: { label: "Cash on Delivery", instructions: config?.payments.cod.instructions },
  };

  const placeOrder = async () => {
    if (!items.length) return;
    if (name.trim().length < 2) return push("Please enter your full name", "error");
    if (!/^[0-9+]{6,20}$/.test(phone.replace(/[\s-]/g, ""))) return push("Please enter a valid phone number", "error");
    if (!district.trim()) return push("Please select your district", "error");
    if (address.trim().length < 5) return push("Please enter your full delivery address", "error");
    if (activeMethod !== "cod" && !trxId.trim()) return push("Please enter your Transaction ID", "error");

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          district: district.trim(),
          area: area.trim() || null,
          address: address.trim(),
          instructions: instructions.trim() || null,
          paymentMethod: activeMethod,
          transactionRef: activeMethod === "cod" ? null : trxId.trim(),
          couponCode: couponApplied?.code || null,
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to place order");

      // Snapshot for success page + WhatsApp flow
      const snapshot = {
        orderRef: d.orderRef,
        subtotal: d.subtotal,
        discount: d.discount,
        deliveryFee: d.deliveryFee,
        total: d.total,
        paymentStatus: d.paymentStatus,
        name: name.trim(),
        phone: phone.trim(),
        district: district.trim(),
        address: address.trim(),
        paymentMethod: methodMeta[activeMethod].label,
        items: items.map((i) => ({ name: i.name, variant: i.variantLabel, qty: i.qty, price: i.unitPrice })),
        waUrl: orderWhatsAppUrl({
          orderRef: d.orderRef,
          items: items.map((i) => ({ name: i.name, variant: i.variantLabel || undefined, qty: i.qty, price: i.unitPrice })),
          subtotal: d.subtotal,
          deliveryFee: d.deliveryFee,
          discount: d.discount,
          total: d.total,
          name: name.trim(),
          phone: phone.trim(),
          district: district.trim(),
          address: address.trim(),
          paymentMethod: methodMeta[activeMethod].label,
          base: config?.whatsappUrl,
        }),
      };
      sessionStorage.setItem("rifoi_last_order", JSON.stringify(snapshot));
      clear();
      router.push(`/order-success?ref=${encodeURIComponent(d.orderRef)}`);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to place order", "error");
    } finally {
      setPlacing(false);
    }
  };

  if (!loaded) return null;
  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState title="Nothing to checkout" message="Your cart is empty. Add some products first." actionHref="/shop" actionText="Browse Products" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-neutral-500">Guest checkout — no account needed.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Contact & address */}
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6">
            <h2 className="font-display text-base font-extrabold">1. Delivery Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="mb-1 block text-xs font-bold text-neutral-600">Full Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tanvir Ahmed" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-600">Phone Number *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-neutral-600">Email (optional)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-600">District *</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-700">
                  {BD_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-neutral-600">Area / Thana</label>
                <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Mirpur, Uttara" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-neutral-600">Full Delivery Address *</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="House, Road, Area…" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-neutral-600">Delivery Instructions (optional)</label>
                <input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Call before delivery" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100" />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6">
            <h2 className="font-display text-base font-extrabold">2. Payment Method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {enabledMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`rounded-xl border-2 p-4 text-left transition ${activeMethod === m ? "border-red-700 bg-red-50" : "border-neutral-200 hover:border-neutral-300"}`}
                >
                  <p className="text-sm font-extrabold">{methodMeta[m].label}</p>
                  {methodMeta[m].number && m !== "cod" && (
                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">{methodMeta[m].number}</p>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200/60">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">How to pay with {methodMeta[activeMethod].label}</p>
              <div className="rifoi-prose mt-2 text-sm text-neutral-700">
                {methodMeta[activeMethod].instructions || "Follow the instructions provided."}
              </div>
              {activeMethod !== "cod" && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-bold text-neutral-600">
                    Transaction ID / Reference * <span className="font-normal text-neutral-400">(from your {methodMeta[activeMethod].label} receipt)</span>
                  </label>
                  <input
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 9HXK2LDM4P"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  />
                  <p className="mt-2 text-xs text-amber-700">
                    Your payment stays <b>Pending Verification</b> until our team verifies the transaction. Never share your PIN or OTP with anyone.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-neutral-200/80 bg-white p-6 lg:sticky lg:top-36">
          <h2 className="font-display text-base font-extrabold">Order Summary</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
            {items.map((it) => (
              <div key={`${it.productId}-${it.variantId || "b"}`} className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  <ProductImage src={it.image} alt={it.name} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="clamp-1 text-xs font-bold">{it.name}</p>
                  {it.variantLabel && <p className="text-[11px] text-neutral-500">{it.variantLabel}</p>}
                  <p className="text-[11px] text-neutral-500">Qty {it.qty} × {formatPrice(it.unitPrice)}</p>
                </div>
                <p className="text-xs font-extrabold">{formatPrice(it.unitPrice * it.qty)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4">
            <label className="mb-1 block text-xs font-bold text-neutral-600">Coupon Code</label>
            {couponApplied ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-sm ring-1 ring-emerald-200">
                <span className="font-bold text-emerald-800">{couponApplied.code} (−{formatPrice(couponApplied.discount)})</span>
                <button onClick={() => { setCouponApplied(null); setCoupon(""); }} className="text-xs font-bold text-red-600">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Enter code" className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm uppercase outline-none focus:border-red-700" />
                <button onClick={applyCoupon} className="shrink-0 rounded-xl bg-neutral-900 px-4 text-sm font-bold text-white hover:bg-red-700">Apply</button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600"><span>Subtotal</span><b className="text-neutral-900">{formatPrice(subtotal)}</b></div>
            {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><b>−{formatPrice(discount)}</b></div>}
            <div className="flex justify-between text-neutral-600"><span>Delivery ({district})</span><b className="text-neutral-900">{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</b></div>
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-lg font-extrabold"><span>Total</span><span className="text-red-700">{formatPrice(total)}</span></div>
          </div>

          <button
            onClick={placeOrder}
            disabled={placing}
            className="mt-5 w-full rounded-xl bg-red-700 py-4 text-sm font-extrabold text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {placing ? "Placing Order…" : `Place Order • ${formatPrice(total)}`}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-neutral-500">
            By placing this order you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/return-policy" className="underline">Return Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
