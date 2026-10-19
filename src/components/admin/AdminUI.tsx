"use client";

import { useState } from "react";

export const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100";

export const labelCls = "mb-1 block text-xs font-bold text-neutral-600";

export const btnPrimary =
  "rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60";

export const btnDanger =
  "rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60";

export const btnGhost =
  "rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-bold text-neutral-700 transition hover:border-neutral-400";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-neutral-400">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5"
      aria-pressed={checked}
    >
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-neutral-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className={`flex max-h-[94vh] w-full flex-col rounded-t-3xl bg-[#faf7f2] shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-5xl" : "sm:max-w-2xl"}`}>
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 sm:rounded-t-3xl">
          <h3 className="font-display text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-neutral-100" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmText = "Delete",
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-fade-up">
        <h3 className="font-display text-lg font-extrabold">{title}</h3>
        <p className="mt-2 text-sm text-neutral-600">{message}</p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className={`${btnGhost} flex-1`} disabled={busy}>Cancel</button>
          <button onClick={onConfirm} className={`${btnDanger} flex-1`} disabled={busy}>
            {busy ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-800",
    draft: "bg-neutral-200 text-neutral-700",
    archived: "bg-stone-200 text-stone-600",
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-violet-100 text-violet-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-orange-100 text-orange-800",
    paid: "bg-emerald-100 text-emerald-800",
    verified: "bg-emerald-100 text-emerald-800",
    pending_verification: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-stone-200 text-stone-700",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${map[status] || "bg-neutral-200 text-neutral-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ImageUploader({
  images,
  onChange,
}: {
  images: { imageUrl: string; alt?: string | null; isMain?: boolean }[];
  onChange: (imgs: { imageUrl: string; alt?: string | null; isMain?: boolean }[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      for (const f of Array.from(files).slice(0, 10)) form.append("files", f);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Upload failed");
      const next = [...images];
      for (const url of d.urls as string[]) {
        next.push({ imageUrl: url, alt: "", isMain: next.length === 0 });
      }
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...images];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={`${img.imageUrl}-${i}`} className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt={img.alt || `Image ${i + 1}`} className="aspect-square w-full object-cover" />
            {img.isMain && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-red-700 px-2 py-0.5 text-[10px] font-bold text-white">MAIN</span>
            )}
            <div className="flex items-center justify-between bg-white px-1.5 py-1">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded bg-neutral-100 px-1.5 text-xs font-bold disabled:opacity-30" aria-label="Move left">←</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="rounded bg-neutral-100 px-1.5 text-xs font-bold disabled:opacity-30" aria-label="Move right">→</button>
              </div>
              <div className="flex gap-1">
                {!img.isMain && (
                  <button
                    type="button"
                    onClick={() => onChange(images.map((x, xi) => ({ ...x, isMain: xi === i })))}
                    className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold"
                    title="Set as main image"
                  >
                    Main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = images.filter((_, xi) => xi !== i);
                    if (next.length && !next.some((x) => x.isMain)) next[0].isMain = true;
                    onChange(next);
                  }}
                  className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white text-neutral-400 transition hover:border-red-500 hover:text-red-600">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M4 18l5-5 3 3 3-3 5 5" />
          </svg>
          <span className="mt-1 px-2 text-center text-[11px] font-bold">
            {uploading ? "Uploading…" : "Upload Product Images"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              upload(e.target.files);
              e.target.value = "";
            }}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <p className="mt-2 text-[11px] text-neutral-400">JPG, PNG, WEBP or GIF • Max 5MB each • First image (or MAIN) shows as the cover photo.</p>
    </div>
  );
}

export function SingleImageButton({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Upload failed");
      onChange(d.urls[0]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={label} className="h-14 w-14 rounded-xl border border-neutral-200 object-cover" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-bold text-neutral-400">No image</span>
      )}
      <div className="flex gap-2">
        <label className={`${btnGhost} cursor-pointer !px-4 !py-2 !text-xs`}>
          {uploading ? "Uploading…" : `Upload ${label}`}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange("")} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
