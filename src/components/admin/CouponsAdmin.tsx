"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { LoadingState } from "@/components/ui";
import { Field, Modal, ConfirmDialog, Toggle, btnGhost, btnPrimary, inputCls } from "./AdminUI";

type Coupon = {
  id: string; code: string; discountType: string; value: number;
  minOrderAmount: number; maxDiscountAmount: number | null;
  usageLimit: number | null; usedCount: number; expiresAt: string | null; isActive: boolean;
};

export default function CouponsAdmin() {
  const { push } = useToast();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ code: "", discountType: "percent", value: "10", minOrderAmount: "0", maxDiscountAmount: "", usageLimit: "", expiresAt: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setRows(d.coupons);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", discountType: "percent", value: "10", minOrderAmount: "0", maxDiscountAmount: "", usageLimit: "", expiresAt: "", isActive: true });
    setShow(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, discountType: c.discountType, value: String(c.value),
      minOrderAmount: String(c.minOrderAmount), maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "",
      isActive: c.isActive,
    });
    setShow(true);
  };

  const save = async () => {
    if (form.code.trim().length < 2) return push("Enter a coupon code", "error");
    if (!form.value || Number(form.value) < 1) return push("Enter a valid discount value", "error");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          discountType: form.discountType,
          value: Number(form.value),
          minOrderAmount: Number(form.minOrderAmount) || 0,
          maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
          usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
          expiresAt: form.expiresAt || null,
          isActive: form.isActive,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      push(editing ? "Coupon updated" : "Coupon created", "success");
      setShow(false);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/coupons/${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      push("Coupon deleted", "success");
      setDeleting(null);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState text="Loading coupons…" />;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Discount Coupons ({rows.length})</h2>
          <p className="text-xs text-neutral-500">Create promo codes for percent or flat discounts.</p>
        </div>
        <button onClick={openNew} className={`${btnPrimary} ml-auto`}>+ New Coupon</button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-bold">No coupons yet</p>
          <p className="mt-1 text-sm text-neutral-500">Create your first discount code, e.g. WELCOME10 for 10% off.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4">
              <span className="rounded-lg bg-neutral-900 px-3 py-1.5 font-mono text-sm font-bold text-white">{c.code}</span>
              <span className="text-sm font-bold">
                {c.discountType === "percent" ? `${c.value}% off` : `৳${c.value} off`}
              </span>
              <span className="text-xs text-neutral-500">
                Min ৳{c.minOrderAmount} • Used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""} •
                {c.expiresAt ? ` Expires ${new Date(c.expiresAt).toLocaleDateString()}` : " No expiry"}
              </span>
              <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold ${c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"}`}>
                {c.isActive ? "ACTIVE" : "OFF"}
              </span>
              <button onClick={() => openEdit(c)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white">Edit</button>
              <button onClick={() => setDeleting(c)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
            </div>
          ))}
        </div>
      )}

      {show && (
        <Modal title={editing ? "Edit Coupon" : "New Coupon"} onClose={() => setShow(false)}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Coupon Code *"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={`${inputCls} uppercase`} placeholder="WELCOME10" /></Field>
            <Field label="Discount Type">
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className={inputCls}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (৳)</option>
              </select>
            </Field>
            <Field label={form.discountType === "percent" ? "Percent Value (1–100) *" : "Fixed Amount (৳) *"}>
              <input type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Minimum Order (৳)"><input type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className={inputCls} /></Field>
            <Field label="Max Discount Cap (৳, optional)"><input type="number" min={0} value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} className={inputCls} placeholder="No cap" /></Field>
            <Field label="Usage Limit (optional)"><input type="number" min={1} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className={inputCls} placeholder="Unlimited" /></Field>
            <Field label="Expiry Date (optional)"><input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls} /></Field>
            <div className="flex items-end"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></div>
            <div className="flex gap-3 md:col-span-2">
              <button onClick={() => setShow(false)} className={btnGhost}>Cancel</button>
              <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog title="Delete coupon?" message={`Code “${deleting.code}” will stop working immediately.`} onConfirm={doDelete} onCancel={() => setDeleting(null)} busy={busy} />
      )}
    </div>
  );
}
