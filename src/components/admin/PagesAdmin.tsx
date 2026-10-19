"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { LoadingState } from "@/components/ui";
import { Field, btnPrimary, inputCls } from "./AdminUI";

type Page = { slug: string; title: string; content: string | null };

const KNOWN = [
  { slug: "about", label: "About Us (/about)" },
  { slug: "contact", label: "Contact info text (shown on /contact)" },
  { slug: "faq", label: "FAQ (/faq)" },
  { slug: "shipping-policy", label: "Shipping Policy (/shipping-policy)" },
  { slug: "return-policy", label: "Return & Refund Policy (/return-policy)" },
  { slug: "privacy-policy", label: "Privacy Policy (/privacy-policy)" },
  { slug: "terms", label: "Terms & Conditions (/terms)" },
];

export default function PagesAdmin() {
  const { push } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("about");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setPages(d.pages || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const p = pages.find((x) => x.slug === active);
    setTitle(p?.title || "");
    setContent(p?.content || "");
  }, [active, pages]);

  const save = async () => {
    if (!title.trim()) return push("Enter a page title", "error");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: active, title: title.trim(), content }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      push("Page saved — live on the website", "success");
      setPages((prev) => {
        const next = prev.filter((x) => x.slug !== active);
        return [...next, { slug: active, title: title.trim(), content }];
      });
    } catch (e) {
      push(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading pages…" />;

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold">Pages & Policies</h2>
      <p className="mb-4 text-xs text-neutral-500">Edit store information pages. Use blank lines between paragraphs.</p>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1 rounded-2xl border border-neutral-200/80 bg-white p-3">
          {KNOWN.map((k) => (
            <button
              key={k.slug}
              onClick={() => setActive(k.slug)}
              className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold ${active === k.slug ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-6">
          <Field label="Page Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
          <Field label="Content" hint="Plain text. Blank line = new paragraph.">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} className={`${inputCls} font-mono !text-[13px]`} />
          </Field>
          <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save Page"}</button>
        </div>
      </div>
    </div>
  );
}
