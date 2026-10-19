"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { LoadingState } from "@/components/ui";
import { Field, Modal, ConfirmDialog, SingleImageButton, Toggle, btnGhost, btnPrimary, inputCls } from "./AdminUI";

type Cat = {
  id: string; name: string; slug: string; description: string | null;
  imageUrl: string | null; sortOrder: number; isPublished: boolean;
};

export default function CategoriesAdmin() {
  const { push } = useToast();
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", imageUrl: "", sortOrder: "0", isPublished: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Cat | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setCats(d.categories);
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
    setForm({ name: "", slug: "", description: "", imageUrl: "", sortOrder: String(cats.length + 1), isPublished: true });
    setShow(true);
  };

  const openEdit = (c: Cat) => {
    setEditing(c);
    setForm({
      name: c.name, slug: c.slug, description: c.description || "",
      imageUrl: c.imageUrl || "", sortOrder: String(c.sortOrder), isPublished: c.isPublished,
    });
    setShow(true);
  };

  const save = async () => {
    if (form.name.trim().length < 2) return push("Enter a category name", "error");
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          description: form.description.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          sortOrder: Number(form.sortOrder) || 0,
          isPublished: form.isPublished,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      push(editing ? "Category updated" : "Category created", "success");
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
      const res = await fetch(`/api/admin/categories/${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      push("Category deleted (products moved to no category)", "success");
      setDeleting(null);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState text="Loading categories…" />;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Categories ({cats.length})</h2>
          <p className="text-xs text-neutral-500">Lower order number shows first. Hide with the publish switch.</p>
        </div>
        <button onClick={openNew} className={`${btnPrimary} ml-auto`}>+ Add Category</button>
      </div>

      <div className="space-y-2">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-extrabold text-neutral-500">{c.sortOrder}</span>
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt={c.name} className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 font-display text-lg font-extrabold text-neutral-300">{c.name.charAt(0)}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{c.name} <span className="font-normal text-neutral-400">/{c.slug}</span></p>
              <p className="text-xs text-neutral-500">{c.isPublished ? "● Published" : "○ Hidden"}</p>
            </div>
            <button onClick={() => openEdit(c)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white">Edit</button>
            <button onClick={() => setDeleting(c)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">Delete</button>
          </div>
        ))}
      </div>

      {show && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setShow(false)}>
          <div className="space-y-4">
            <Field label="Category Name *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Men's Fashion" /></Field>
            <Field label="Slug (auto if empty)"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputCls} placeholder="mens-fashion" /></Field>
            <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputCls} /></Field>
            <Field label="Category Image"><SingleImageButton value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} label="Image" /></Field>
            <Field label="Display Order"><input type="number" min={0} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={inputCls} /></Field>
            <Toggle checked={form.isPublished} onChange={(v) => setForm({ ...form, isPublished: v })} label="Published (visible in store)" />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShow(false)} className={btnGhost}>Cancel</button>
              <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete category?"
          message={`“${deleting.name}” will be deleted. Its products will become uncategorized (not deleted).`}
          onConfirm={doDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
