"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { LoadingState } from "@/components/ui";
import { Field, SingleImageButton, Toggle, btnPrimary, inputCls } from "./AdminUI";

const KEYS = [
  "announcement", "announcementActive", "whatsappLocal", "whatsappIntl",
  "facebookUrl", "supportPhone", "supportEmail", "storeAddress",
  "deliveryDhaka", "deliveryOutside", "freeShippingThreshold",
  "bkashEnabled", "nagadEnabled", "rocketEnabled", "codEnabled",
  "bkashNumber", "nagadNumber", "rocketNumber",
  "bkashInstructions", "nagadInstructions", "rocketInstructions", "codInstructions",
  "logoUrl", "heroTitle", "heroSubtitle", "heroCtaText", "heroCtaLink", "heroImage",
  "newsletterEnabled", "metaTitle", "metaDescription",
];

export default function SettingsAdmin() {
  const { push } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"general" | "payments" | "homepage" | "security">("general");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setForm(d.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const v = (k: string) => form[k] ?? "";
  const set = (k: string, val: string) => setForm((f) => ({ ...f, [k]: val }));
  const bool = (k: string) => form[k] === "true";

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      for (const k of KEYS) payload[k] = form[k] ?? "";
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      push("Settings saved — store updated", "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (next.length < 8) return push("New password must be at least 8 characters", "error");
    if (next !== next2) return push("New passwords do not match", "error");
    setPwBusy(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      push("Password changed successfully", "success");
      setCur("");
      setNext("");
      setNext2("");
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setPwBusy(false);
    }
  };

  if (loading) return <LoadingState text="Loading settings…" />;

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold">Settings & Payments</h2>
      <p className="mb-4 text-xs text-neutral-500">Every change here updates the live store immediately after saving.</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ["general", "General & Contact"],
            ["payments", "Payments & Delivery"],
            ["homepage", "Homepage & Brand"],
            ["security", "Security"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === k ? "bg-neutral-900 text-white" : "border border-neutral-200 bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-6">
          <Toggle checked={v("announcementActive") === "true"} onChange={(x) => set("announcementActive", x ? "true" : "false")} label="Show announcement bar" />
          <Field label="Announcement Bar Text"><input value={v("announcement")} onChange={(e) => set("announcement", e.target.value)} className={inputCls} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="WhatsApp Number (local, shown to customers)" hint="e.g. 01312812139"><input value={v("whatsappLocal")} onChange={(e) => set("whatsappLocal", e.target.value)} className={inputCls} /></Field>
            <Field label="WhatsApp Number (international, no +)" hint="e.g. 8801312812139 — used for wa.me links"><input value={v("whatsappIntl")} onChange={(e) => set("whatsappIntl", e.target.value)} className={inputCls} /></Field>
            <Field label="Facebook Page URL"><input value={v("facebookUrl")} onChange={(e) => set("facebookUrl", e.target.value)} className={inputCls} /></Field>
            <Field label="Support Hotline"><input value={v("supportPhone")} onChange={(e) => set("supportPhone", e.target.value)} className={inputCls} /></Field>
            <Field label="Support Email"><input value={v("supportEmail")} onChange={(e) => set("supportEmail", e.target.value)} className={inputCls} /></Field>
            <Field label="Store Address"><input value={v("storeAddress")} onChange={(e) => set("storeAddress", e.target.value)} className={inputCls} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO Title"><input value={v("metaTitle")} onChange={(e) => set("metaTitle", e.target.value)} className={inputCls} /></Field>
            <Field label="SEO Description"><input value={v("metaDescription")} onChange={(e) => set("metaDescription", e.target.value)} className={inputCls} /></Field>
          </div>
          <Toggle checked={v("newsletterEnabled") === "true"} onChange={(x) => set("newsletterEnabled", x ? "true" : "false")} label="Enable newsletter signup in footer" />
        </div>
      )}

      {tab === "payments" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6">
            <h3 className="font-display text-base font-extrabold">Delivery Fees (BDT ৳)</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <Field label="Inside Dhaka"><input type="number" min={0} value={v("deliveryDhaka")} onChange={(e) => set("deliveryDhaka", e.target.value)} className={inputCls} /></Field>
              <Field label="Outside Dhaka"><input type="number" min={0} value={v("deliveryOutside")} onChange={(e) => set("deliveryOutside", e.target.value)} className={inputCls} /></Field>
              <Field label="Free Shipping Above (0 = off)"><input type="number" min={0} value={v("freeShippingThreshold")} onChange={(e) => set("freeShippingThreshold", e.target.value)} className={inputCls} /></Field>
            </div>
          </div>

          {(
            [
              ["bkash", "bKash"],
              ["nagad", "Nagad"],
              ["rocket", "Rocket"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="space-y-3 rounded-2xl border border-neutral-200/80 bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-extrabold">{label} (Manual)</h3>
                <Toggle checked={bool(`${k}Enabled`)} onChange={(x) => set(`${k}Enabled`, x ? "true" : "false")} label={bool(`${k}Enabled`) ? "Enabled" : "Disabled"} />
              </div>
              <Field label={`${label} Receiving Number`} hint="Same number 01312812139 is used for all three services by default.">
                <input value={v(`${k}Number`)} onChange={(e) => set(`${k}Number`, e.target.value)} className={inputCls} />
              </Field>
              <Field label={`${label} Payment Instructions (shown at checkout)`}>
                <textarea value={v(`${k}Instructions`)} onChange={(e) => set(`${k}Instructions`, e.target.value)} rows={4} className={inputCls} />
              </Field>
            </div>
          ))}

          <div className="space-y-3 rounded-2xl border border-neutral-200/80 bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold">Cash on Delivery</h3>
              <Toggle checked={bool("codEnabled")} onChange={(x) => set("codEnabled", x ? "true" : "false")} label={bool("codEnabled") ? "Enabled" : "Disabled"} />
            </div>
            <Field label="COD Instructions"><textarea value={v("codInstructions")} onChange={(e) => set("codInstructions", e.target.value)} rows={2} className={inputCls} /></Field>
          </div>

          <div className="rounded-2xl bg-blue-50 p-4 text-xs leading-relaxed text-blue-900 ring-1 ring-blue-200">
            <b>About manual payments:</b> customers send money to your number and enter the Transaction ID. Orders stay
            <b> Pending Verification</b> until you confirm the payment in your own bKash/Nagad/Rocket account and mark it Verified/Paid
            in Orders. Automated gateway integration (bKash/Nagad API, cards) can be added later — credentials will live securely server-side.
          </div>
        </div>
      )}

      {tab === "homepage" && (
        <div className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-6">
          <div className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <b>Official logo:</b> the supplied RIFOI logo file was not accessible to this build environment, so a matching
            placeholder emblem (red R in a circle) is used. Upload your official logo image here to replace it everywhere
            (header, footer, mobile menu). Favicons use the same emblem.
          </div>
          <Field label="Official Logo Upload"><SingleImageButton value={v("logoUrl")} onChange={(url) => set("logoUrl", url)} label="Logo" /></Field>
          <Field label="Hero Title"><input value={v("heroTitle")} onChange={(e) => set("heroTitle", e.target.value)} className={inputCls} /></Field>
          <Field label="Hero Subtitle"><textarea value={v("heroSubtitle")} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} className={inputCls} /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hero Button Text"><input value={v("heroCtaText")} onChange={(e) => set("heroCtaText", e.target.value)} className={inputCls} /></Field>
            <Field label="Hero Button Link"><input value={v("heroCtaLink")} onChange={(e) => set("heroCtaLink", e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="Hero Side Image (fallback when no hero banner image)"><SingleImageButton value={v("heroImage")} onChange={(url) => set("heroImage", url)} label="Hero Image" /></Field>
          <p className="text-xs text-neutral-500">Tip: for full control use <b>Banners & Homepage</b> — hero banners there override these defaults.</p>
        </div>
      )}

      {tab === "security" && (
        <div className="max-w-lg space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-6">
          <h3 className="font-display text-base font-extrabold">Change Admin Password</h3>
          <Field label="Current Password"><input type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} autoComplete="current-password" /></Field>
          <Field label="New Password (min 8 characters)"><input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} autoComplete="new-password" /></Field>
          <Field label="Confirm New Password"><input type="password" value={next2} onChange={(e) => setNext2(e.target.value)} className={inputCls} autoComplete="new-password" /></Field>
          <button onClick={changePassword} disabled={pwBusy} className={btnPrimary}>{pwBusy ? "Changing…" : "Change Password"}</button>
          <p className="text-xs text-neutral-500">Sessions expire after 7 days. Login is rate-limited and locked after repeated failures.</p>
        </div>
      )}

      {tab !== "security" && (
        <div className="mt-5">
          <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save All Settings"}</button>
        </div>
      )}
    </div>
  );
}
