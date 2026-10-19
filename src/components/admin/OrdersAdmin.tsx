"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { LoadingState } from "@/components/ui";
import { Field, Modal, StatusPill, btnGhost, btnPrimary, inputCls } from "./AdminUI";

type Order = {
  id: string; orderRef: string; customerName: string; customerPhone: string;
  customerEmail: string | null; district: string; area: string | null; address: string;
  deliveryInstructions: string | null; subtotal: number; discount: number; couponCode: string | null;
  deliveryFee: number; total: number; paymentMethod: string; paymentStatus: string;
  transactionRef: string | null; status: string; adminNotes: string | null; createdAt: string;
};
type Item = {
  id: string; productName: string; variantInfo: { label?: string } | null;
  quantity: number; unitPrice: number; totalPrice: number;
};

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];
const PAY_STATUSES = ["pending", "pending_verification", "verified", "paid", "failed", "refunded"];

export default function OrdersAdmin() {
  const { push } = useToast();
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [detail, setDetail] = useState<Order | null>(null);
  const [detailItems, setDetailItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editPay, setEditPay] = useState("");
  const [editTrx, setEditTrx] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      if (payment) params.set("payment", payment);
      const res = await fetch(`/api/admin/orders?${params}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setRows(d.orders);
      setTotal(d.total);
      setTotalPages(d.totalPages || 1);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, payment, push]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setDetail(d.order);
      setDetailItems(d.items);
      setEditStatus(d.order.status);
      setEditPay(d.order.paymentStatus);
      setEditTrx(d.order.transactionRef || "");
      setEditNotes(d.order.adminNotes || "");
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to load order", "error");
    }
  };

  const saveDetail = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPay,
          transactionRef: editTrx || null,
          adminNotes: editNotes || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      push("Order updated", "success");
      setDetail(null);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-display text-xl font-extrabold">Orders ({total})</h2>
        <p className="text-xs text-neutral-500">Verify mobile payments, update statuses, view delivery details.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search ref, name, phone…" className={`${inputCls} max-w-xs`} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputCls} max-w-[170px]`}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }} className={`${inputCls} max-w-[200px]`}>
          <option value="">All payments</option>
          {PAY_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingState text="Loading orders…" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-bold">No orders found</p>
          <p className="mt-1 text-sm text-neutral-500">New customer orders will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <button
              key={o.id}
              onClick={() => openDetail(o.id)}
              className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 text-left transition hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{o.orderRef}</p>
                <p className="truncate text-xs text-neutral-500">{o.customerName} • {o.customerPhone} • {o.district}</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {new Date(o.createdAt).toLocaleString("en-GB")} • {o.paymentMethod.toUpperCase()}
                  {o.transactionRef ? ` • Trx: ${o.transactionRef}` : ""}
                </p>
              </div>
              <p className="text-sm font-extrabold">{formatPrice(o.total)}</p>
              <StatusPill status={o.status} />
              <StatusPill status={o.paymentStatus} />
            </button>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className={`${btnGhost} !px-4`}>← Prev</button>
              <span className="text-sm font-bold">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className={`${btnGhost} !px-4`}>Next →</button>
            </div>
          )}
        </div>
      )}

      {detail && (
        <Modal title={`Order ${detail.orderRef}`} onClose={() => setDetail(null)} wide>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Customer & Delivery</p>
                <p className="mt-2 text-sm"><b>{detail.customerName}</b></p>
                <p className="text-sm">{detail.customerPhone}</p>
                {detail.customerEmail && <p className="text-sm">{detail.customerEmail}</p>}
                <p className="mt-2 text-sm">{detail.address}{detail.area ? `, ${detail.area}` : ""}, {detail.district}</p>
                {detail.deliveryInstructions && <p className="mt-1 text-xs italic text-neutral-500">Note: {detail.deliveryInstructions}</p>}
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Items</p>
                <div className="mt-2 space-y-2 text-sm">
                  {detailItems.map((it) => (
                    <div key={it.id} className="flex justify-between gap-2">
                      <span>{it.productName}{it.variantInfo?.label ? ` (${it.variantInfo.label})` : ""} × {it.quantity}</span>
                      <b>{formatPrice(it.totalPrice)}</b>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1 border-t border-neutral-100 pt-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(detail.subtotal)}</span></div>
                  {detail.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount {detail.couponCode ? `(${detail.couponCode})` : ""}</span><span>−{formatPrice(detail.discount)}</span></div>}
                  <div className="flex justify-between"><span>Delivery</span><span>{formatPrice(detail.deliveryFee)}</span></div>
                  <div className="flex justify-between font-extrabold"><span>Total</span><span>{formatPrice(detail.total)}</span></div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Payment</p>
                <p className="mt-2 text-sm">Method: <b className="uppercase">{detail.paymentMethod}</b></p>
                <p className="text-sm">Customer Trx Ref: <b>{detail.transactionRef || "—"}</b></p>
                <div className="mt-2 flex gap-2"><StatusPill status={detail.paymentStatus} /></div>
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-800">
                  Manual payments (bKash/Nagad/Rocket) must be verified in your own account before marking as Verified/Paid. Never mark paid on TrxID alone.
                </p>
              </div>
              <Field label="Order Status">
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Payment Status">
                <select value={editPay} onChange={(e) => setEditPay(e.target.value)} className={inputCls}>
                  {PAY_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <Field label="Transaction Reference"><input value={editTrx} onChange={(e) => setEditTrx(e.target.value)} className={inputCls} /></Field>
              <Field label="Admin Notes (private)"><textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className={inputCls} /></Field>
              <div className="flex gap-3">
                <button onClick={() => setDetail(null)} className={btnGhost}>Close</button>
                <button onClick={saveDetail} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
