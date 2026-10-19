"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { LoadingState } from "@/components/ui";
import { Field, Modal, ConfirmDialog, SingleImageButton, Toggle, btnGhost, btnPrimary, inputCls } from "./AdminUI";

type Banner = {
  id: string; title: string | null; subtitle: string | null; imageUrl: string | null;
  ctaText: string | null; ctaLink: string | null; position: string; sortOrder: number; isActive: boolean;
};

const POSITIONS = [
  { value: "hero", label: "Hero (main homepage banner)" },
  { value: "promo", label: "Promo (mid-page cards)" },
  { value: "offer", label: "Offer (big sale banner)" },
  { value: "category", label: "Category (reserved)" },
];

export default function BannersAdmin() {
  const { push } = useToast();
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "", ctaText: "", ctaLink: "", position: "hero", sortOrder: "0", isActive: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setRows(d.banners);
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
    setForm({ title: "", subtitle: "", imageUrl: "", ctaText: "Shop Now", ctaLink: "/shop", position: "hero", sortOrder: String(rows.length), isActive: true });
    setShow(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title || "", subtitle: b.subtitle || "", imageUrl: b.imageUrl || "",
      ctaText: b.ctaText || "", ctaLink: b.ctaLink || "", position: b.position,
      sortOrder: String(b.sortOrder), isActive: b.isActive,
    });
    setShow(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim() || null,
          subtitle: form.subtitle.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          ctaText: form.ctaText.trim() || null,
          ctaLink: form.ctaLink.trim() || null,
          position: form.position,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      push("Banner saved — homepage updated", "success");
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
      const res = await fetch(`/api/admin/banners/${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      push("Banner deleted", "success");
      setDeleting(null);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState text="Loading banners…" />;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Banners & Homepage ({rows.length})</h2>
          <p className="text-xs text-neutral-500">Homepage hero, promo cards and offer banners. Changes go live instantly.</p>
        </div>
        <button onClick={openNew} className={`${btnPrimary} ml-auto`}>+ New Banner</button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-bold">No banners yet</p>
          <p className="mt-1 text-sm text-neutral-500">Add a hero banner to customize your homepage top section.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4">
              {b.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.imageUrl} alt={b.title || "Banner"} className="h-16 w-28 rounded-xl object-cover" />
              ) : (
                <span className="flex h-16 w-28 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-bold text-neutral-400">No image</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{b.title || "(no title)"}</p>
                <p className="truncate text-xs text-neutral-500">{b.subtitle || "—"}</p>
                <p className="text-[11px] font-bold text-red-700">
                  {POSITIONS.find((p) => p.value === b.position)?.label} • Order {b.sortOrder} • {b.isActive ? "Active" : "Hidden"}
                </p>
              </div>
              <button onClick={() => openEdit(b)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white">Edit</button>
              <button onClick={() => setDeleting(b)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
            </div>
          ))}
        </div>
      )}

      {show && (
        <Modal title={editing ? "Edit Banner" : "New Banner"} onClose={() => setShow(false)}>
          <div className="space-y-4">
            <Field label="Position">
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputCls}>
                {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="e.g. Eid Mega Sale" /></Field>
            <Field label="Subtitle"><textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} className={inputCls} placeholder="Short supporting text…" /></Field>
            <Field label="Background Image"><SingleImageButton value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} label="Banner Image" /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Button Text"><input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} className={inputCls} placeholder="Shop Now" /></Field>
              <Field label="Button Link"><input value={form.ctaLink} onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} className={inputCls} placeholder="/shop or /shop?category=shirts" /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Display Order"><input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={inputCls} /></Field>
              <div className="flex items-end"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShow(false)} className={btnGhost}>Cancel</button>
              <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog title="Delete banner?" message="This banner will be removed from the homepage." onConfirm={doDelete} onCancel={() => setDeleting(null)} busy={busy} />
      )}
    </div>
  );
}
