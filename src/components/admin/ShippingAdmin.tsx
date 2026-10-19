"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { LoadingState } from "@/components/ui";
import { Field, Modal, ConfirmDialog, Toggle, btnGhost, btnPrimary, inputCls } from "./AdminUI";

type Zone = {
  id: string; name: string; districts: string | null; fee: number;
  freeThreshold: number | null; isActive: boolean;
};

export default function ShippingAdmin() {
  const { push } = useToast();
  const [rows, setRows] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [form, setForm] = useState({ name: "", districts: "", fee: "60", freeThreshold: "", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Zone | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shipping");
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setRows(d.zones);
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
    setForm({ name: "", districts: "", fee: "60", freeThreshold: "", isActive: true });
    setShow(true);
  };

  const openEdit = (z: Zone) => {
    setEditing(z);
    setForm({
      name: z.name, districts: z.districts || "", fee: String(z.fee),
      freeThreshold: z.freeThreshold != null ? String(z.freeThreshold) : "", isActive: z.isActive,
    });
    setShow(true);
  };

  const save = async () => {
    if (form.name.trim().length < 2) return push("Enter a zone name", "error");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/shipping/${editing.id}` : "/api/admin/shipping", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          districts: form.districts.trim() || null,
          fee: Number(form.fee) || 0,
          freeThreshold: form.freeThreshold === "" ? null : Number(form.freeThreshold),
          isActive: form.isActive,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      push("Zone saved", "success");
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
      const res = await fetch(`/api/admin/shipping/${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      push("Zone deleted", "success");
      setDeleting(null);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState text="Loading shipping zones…" />;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Delivery Zones ({rows.length})</h2>
          <p className="text-xs text-neutral-500">Base Dhaka / Outside-Dhaka fees live in Settings. Zones below are extra reference rates shown at checkout.</p>
        </div>
        <button onClick={openNew} className={`${btnPrimary} ml-auto`}>+ New Zone</button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-bold">No zones yet</p>
          <p className="mt-1 text-sm text-neutral-500">Add delivery zones, e.g. Inside Dhaka — ৳60.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((z) => (
            <div key={z.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{z.name} <span className="ml-2 font-extrabold text-red-700">৳{z.fee}</span></p>
                <p className="truncate text-xs text-neutral-500">
                  {z.districts || "All districts"} {z.freeThreshold ? `• Free over ৳${z.freeThreshold}` : ""} • {z.isActive ? "Active" : "Off"}
                </p>
              </div>
              <button onClick={() => openEdit(z)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white">Edit</button>
              <button onClick={() => setDeleting(z)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
            </div>
          ))}
        </div>
      )}

      {show && (
        <Modal title={editing ? "Edit Zone" : "New Zone"} onClose={() => setShow(false)}>
          <div className="space-y-4">
            <Field label="Zone Name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Inside Dhaka" /></Field>
            <Field label="Districts (comma separated)" hint="e.g. Dhaka, Gazipur, Narayanganj. Leave empty for all."><input value={form.districts} onChange={(e) => setForm({ ...form, districts: e.target.value })} className={inputCls} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fee (৳) *"><input type="number" min={0} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className={inputCls} /></Field>
              <Field label="Free-Above Threshold (৳, optional)"><input type="number" min={0} value={form.freeThreshold} onChange={(e) => setForm({ ...form, freeThreshold: e.target.value })} className={inputCls} placeholder="No free shipping" /></Field>
            </div>
            <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" />
            <div className="flex gap-3">
              <button onClick={() => setShow(false)} className={btnGhost}>Cancel</button>
              <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog title="Delete zone?" message={`“${deleting.name}” will be removed.`} onConfirm={doDelete} onCancel={() => setDeleting(null)} busy={busy} />
      )}
    </div>
  );
}
