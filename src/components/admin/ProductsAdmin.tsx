"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { LoadingState } from "@/components/ui";
import { Field, ImageUploader, Modal, ConfirmDialog, StatusPill, Toggle, btnGhost, btnPrimary, btnDanger, inputCls } from "./AdminUI";

type Category = { id: string; name: string; slug: string };
type Row = {
  id: string; name: string; slug: string; sku: string | null;
  regularPrice: number; salePrice: number | null; stockQuantity: number;
  status: string; isFeatured: boolean; isNewArrival: boolean;
  categoryName: string; mainImage: string | null; soldCount: number;
};

type Img = { imageUrl: string; alt?: string | null; isMain?: boolean };
type Variant = {
  size: string; color: string; model: string;
  priceOverride: string; stockQuantity: string; sku: string; isAvailable: boolean;
};
const blankVariant = (): Variant => ({ size: "", color: "", model: "", priceOverride: "", stockQuantity: "0", sku: "", isAvailable: true });

type Form = {
  name: string; slug: string; sku: string; categoryId: string; brand: string;
  description: string; specifications: string; materialCare: string;
  regularPrice: string; salePrice: string; stockQuantity: string;
  availabilityStatus: string; tags: string; isFeatured: boolean; isNewArrival: boolean;
  status: string; shippingInfo: string; returnInfo: string; videoUrl: string;
};
const blankForm = (): Form => ({
  name: "", slug: "", sku: "", categoryId: "", brand: "",
  description: "", specifications: "", materialCare: "",
  regularPrice: "", salePrice: "", stockQuantity: "0",
  availabilityStatus: "in_stock", tags: "", isFeatured: false, isNewArrival: true,
  status: "draft", shippingInfo: "", returnInfo: "", videoUrl: "",
});

export default function ProductsAdmin() {
  const { push } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [form, setForm] = useState<Form>(blankForm());
  const [images, setImages] = useState<Img[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q.trim()) params.set("q", q.trim());
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/products?${params}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setRows(d.products);
      setTotal(d.total);
      setTotalPages(d.totalPages || 1);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [page, q, status, push]);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCats(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm(blankForm());
    setImages([]);
    setVariants([]);
    setShowEditor(true);
  };

  const openEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      const p = d.product;
      setEditingId(id);
      setForm({
        name: p.name || "", slug: p.slug || "", sku: p.sku || "", categoryId: p.categoryId || "",
        brand: p.brand || "", description: p.description || "", specifications: p.specifications || "",
        materialCare: p.materialCare || "", regularPrice: String(p.regularPrice ?? ""),
        salePrice: p.salePrice != null ? String(p.salePrice) : "",
        stockQuantity: String(p.stockQuantity ?? 0), availabilityStatus: p.availabilityStatus || "in_stock",
        tags: p.tags || "", isFeatured: !!p.isFeatured, isNewArrival: !!p.isNewArrival,
        status: p.status || "draft", shippingInfo: p.shippingInfo || "", returnInfo: p.returnInfo || "",
        videoUrl: p.videoUrl || "",
      });
      setImages((d.images || []).map((i: { imageUrl: string; alt: string | null; isMain: boolean }) => ({ imageUrl: i.imageUrl, alt: i.alt || "", isMain: i.isMain })));
      setVariants(
        (d.variants || []).map((v: { size: string | null; color: string | null; model: string | null; priceOverride: number | null; stockQuantity: number; sku: string | null; isAvailable: boolean }) => ({
          size: v.size || "", color: v.color || "", model: v.model || "",
          priceOverride: v.priceOverride != null ? String(v.priceOverride) : "",
          stockQuantity: String(v.stockQuantity ?? 0), sku: v.sku || "", isAvailable: v.isAvailable,
        }))
      );
      setShowEditor(true);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to load product", "error");
    }
  };

  const save = async () => {
    if (form.name.trim().length < 2) return push("Enter a product name", "error");
    if (!form.regularPrice || Number(form.regularPrice) < 0) return push("Enter a valid regular price", "error");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || null,
        sku: form.sku.trim() || null,
        categoryId: form.categoryId || null,
        brand: form.brand.trim() || null,
        description: form.description.trim() || null,
        specifications: form.specifications.trim() || null,
        materialCare: form.materialCare.trim() || null,
        regularPrice: Number(form.regularPrice),
        salePrice: form.salePrice === "" ? null : Number(form.salePrice),
        stockQuantity: Number(form.stockQuantity) || 0,
        availabilityStatus: form.availabilityStatus,
        tags: form.tags.trim() || null,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        status: form.status,
        shippingInfo: form.shippingInfo.trim() || null,
        returnInfo: form.returnInfo.trim() || null,
        videoUrl: form.videoUrl.trim() || null,
        images: images.map((i) => ({ imageUrl: i.imageUrl, alt: i.alt || "", isMain: !!i.isMain })),
        variants: variants.map((v) => ({
          size: v.size.trim() || null,
          color: v.color.trim() || null,
          model: v.model.trim() || null,
          priceOverride: v.priceOverride === "" ? null : Number(v.priceOverride),
          stockQuantity: Number(v.stockQuantity) || 0,
          sku: v.sku.trim() || null,
          isAvailable: v.isAvailable,
        })),
      };
      const res = await fetch(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      push(editingId ? "Product updated" : "Product created", "success");
      setShowEditor(false);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/products/${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      push("Product deleted", "success");
      setDeleting(null);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const quickStatus = async (row: Row, next: string) => {
    try {
      const full = await fetch(`/api/admin/products/${row.id}`).then((r) => r.json());
      if (full.error) throw new Error(full.error);
      const p = full.product;
      const res = await fetch(`/api/admin/products/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...p,
          categoryId: p.categoryId,
          images: (full.images || []).map((i: { imageUrl: string; alt: string | null; isMain: boolean }) => ({ imageUrl: i.imageUrl, alt: i.alt || "", isMain: i.isMain })),
          variants: (full.variants || []).map((v: { size: string | null; color: string | null; model: string | null; priceOverride: number | null; stockQuantity: number; sku: string | null; isAvailable: boolean }) => ({
            size: v.size, color: v.color, model: v.model, priceOverride: v.priceOverride,
            stockQuantity: v.stockQuantity, sku: v.sku, isAvailable: v.isAvailable,
          })),
          status: next,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      push(`Product ${next}`, "success");
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "error");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Products ({total})</h2>
          <p className="text-xs text-neutral-500">Add products, upload photos, set prices, sizes, colors & stock.</p>
        </div>
        <button onClick={openNew} className={`${btnPrimary} ml-auto`}>+ Add New Product</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search name, SKU, slug…"
          className={`${inputCls} max-w-xs`}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputCls} max-w-[180px]`}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <LoadingState text="Loading products…" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-bold">No products yet</p>
          <p className="mt-1 text-sm text-neutral-500">Click “Add New Product” to create your first product. Upload photos, set the price, and publish when ready.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {r.mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.mainImage} alt={r.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-neutral-400">No photo</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.name}</p>
                <p className="text-xs text-neutral-500">{r.categoryName} • {r.sku || "no SKU"} • Stock: {r.stockQuantity} • Sold: {r.soldCount}</p>
                <p className="mt-0.5 text-sm font-extrabold">
                  {formatPrice(r.salePrice ?? r.regularPrice)}{" "}
                  {r.salePrice != null && <span className="text-xs font-normal text-neutral-400 line-through">{formatPrice(r.regularPrice)}</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={r.status} />
                {r.isFeatured && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">FEATURED</span>}
                <select
                  value={r.status}
                  onChange={(e) => quickStatus(r, e.target.value)}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-bold"
                  aria-label="Change status"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <button onClick={() => openEdit(r.id)} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700">Edit</button>
                <button onClick={() => setDeleting(r)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </div>
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

      {showEditor && (
        <Modal title={editingId ? "Edit Product" : "Add New Product"} onClose={() => setShowEditor(false)} wide>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Product Name *"><input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="e.g. Premium Cotton Panjabi" /></Field>
              </div>
              <Field label="URL Slug (auto if empty)" hint="Lowercase letters, numbers, dashes."><input value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputCls} placeholder="premium-cotton-panjabi" /></Field>
              <Field label="SKU / Product Code (auto if empty)"><input value={form.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls} placeholder="PAN-ABC12" /></Field>
              <Field label="Category">
                <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputCls}>
                  <option value="">— No category —</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Brand"><input value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} placeholder="e.g. RIFOI / Aarong / Generic" /></Field>
              <Field label="Regular Price (BDT ৳) *"><input type="number" min={0} value={form.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} className={inputCls} placeholder="1250" /></Field>
              <Field label="Sale Price (BDT ৳, optional)" hint="Leave empty for no discount."><input type="number" min={0} value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} className={inputCls} placeholder="990" /></Field>
              <Field label="Stock Quantity" hint="Used when product has no variants."><input type="number" min={0} value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} className={inputCls} /></Field>
              <Field label="Availability">
                <select value={form.availabilityStatus} onChange={(e) => set("availabilityStatus", e.target.value)} className={inputCls}>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="preorder">Pre-order</option>
                </select>
              </Field>
              <Field label="Status *">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="published">Published (live)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
              </Field>
              <Field label="Tags (comma separated)"><input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} placeholder="summer, cotton, men" /></Field>
              <Field label="Product Video URL (optional)"><input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className={inputCls} placeholder="https://youtube.com/… or mp4 link" /></Field>
              <div className="flex flex-wrap gap-3">
                <Toggle checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} label="Featured product" />
                <Toggle checked={form.isNewArrival} onChange={(v) => set("isNewArrival", v)} label="New arrival" />
              </div>
            </div>

            <Field label="Product Images" hint="Upload photos, drag order with ← →, set MAIN cover, delete with ✕.">
              <ImageUploader images={images} onChange={setImages} />
            </Field>

            <Field label="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} className={inputCls} placeholder="Full product description, fabric, fit, what's in the box…" /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Specifications / Features"><textarea value={form.specifications} onChange={(e) => set("specifications", e.target.value)} rows={4} className={inputCls} placeholder="One feature per line…" /></Field>
              <Field label="Material & Care"><textarea value={form.materialCare} onChange={(e) => set("materialCare", e.target.value)} rows={4} className={inputCls} placeholder="e.g. 100% cotton. Machine wash cold." /></Field>
              <Field label="Shipping Info (optional)"><textarea value={form.shippingInfo} onChange={(e) => set("shippingInfo", e.target.value)} rows={2} className={inputCls} placeholder="Leave empty to use default." /></Field>
              <Field label="Return Info (optional)"><textarea value={form.returnInfo} onChange={(e) => set("returnInfo", e.target.value)} rows={2} className={inputCls} placeholder="Leave empty to use default." /></Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-extrabold">Sizes / Colors / Models (Variants)</p>
                <button onClick={() => setVariants([...variants, blankVariant()])} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white">+ Add Variant</button>
              </div>
              <p className="mb-3 text-[11px] text-neutral-500">Leave empty if the product has no size/color options. Each row = one combination with its own price & stock. Customers must select these before ordering.</p>
              {variants.length === 0 ? (
                <p className="rounded-xl bg-white px-4 py-3 text-sm text-neutral-400 ring-1 ring-neutral-200">No variants — simple product using main stock above.</p>
              ) : (
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200 md:grid-cols-7">
                      <input value={v.size} onChange={(e) => setVariants(variants.map((x, xi) => xi === i ? { ...x, size: e.target.value } : x))} placeholder="Size (M)" className={inputCls} />
                      <input value={v.color} onChange={(e) => setVariants(variants.map((x, xi) => xi === i ? { ...x, color: e.target.value } : x))} placeholder="Color (Red)" className={inputCls} />
                      <input value={v.model} onChange={(e) => setVariants(variants.map((x, xi) => xi === i ? { ...x, model: e.target.value } : x))} placeholder="Model" className={inputCls} />
                      <input type="number" min={0} value={v.priceOverride} onChange={(e) => setVariants(variants.map((x, xi) => xi === i ? { ...x, priceOverride: e.target.value } : x))} placeholder="Price ৳ (opt)" className={inputCls} />
                      <input type="number" min={0} value={v.stockQuantity} onChange={(e) => setVariants(variants.map((x, xi) => xi === i ? { ...x, stockQuantity: e.target.value } : x))} placeholder="Stock" className={inputCls} />
                      <input value={v.sku} onChange={(e) => setVariants(variants.map((x, xi) => xi === i ? { ...x, sku: e.target.value } : x))} placeholder="SKU (opt)" className={inputCls} />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs font-bold">
                          <input type="checkbox" checked={v.isAvailable} onChange={(e) => setVariants(variants.map((x, xi) => xi === i ? { ...x, isAvailable: e.target.checked } : x))} className="h-4 w-4 accent-red-700" />
                          Active
                        </label>
                        <button onClick={() => setVariants(variants.filter((_, xi) => xi !== i))} className="ml-auto rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-neutral-200 pt-4">
              <button onClick={() => setShowEditor(false)} className={btnGhost}>Cancel</button>
              <button onClick={save} disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete product?"
          message={`“${deleting.name}” will be permanently deleted with its images and variants. Past order records keep the product name. This cannot be undone.`}
          onConfirm={doDelete}
          onCancel={() => setDeleting(null)}
          busy={deleteBusy}
        />
      )}
    </div>
  );
}
