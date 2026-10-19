"use client";

import { useState } from "react";
import { useConfig, useToast } from "@/lib/store";

export default function ContactPage() {
  const { config } = useConfig();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [phoneEmail, setPhoneEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const wa = config?.whatsappUrl || "https://wa.me/8801312812139";
  const fb = config?.facebookUrl || "https://www.facebook.com/share/18MBugQQsA/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return push("Please enter your name", "error");
    if (phoneEmail.trim().length < 5) return push("Please enter your phone or email", "error");
    if (message.trim().length < 5) return push("Please write your message", "error");
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phoneEmail: phoneEmail.trim(), subject: subject.trim(), message: message.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to send");
      push("Message sent! We will contact you soon.", "success");
      setName("");
      setPhoneEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-center font-display text-2xl font-extrabold md:text-3xl">Contact Us</h1>
      <p className="mt-1 text-center text-sm text-neutral-500">We reply fast — usually within minutes during support hours (9 AM – 11 PM).</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-[#25D366] p-5 text-white transition hover:brightness-95">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z" /></svg>
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider opacity-80">WhatsApp / Hotline</span>
              <span className="block font-display text-xl font-extrabold">{config?.whatsappLocal || "01312812139"}</span>
            </span>
          </a>
          <a href={fb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-[#1877F2] p-5 text-white transition hover:brightness-95">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" /></svg>
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider opacity-80">Facebook Page</span>
              <span className="block font-display text-lg font-extrabold">Follow RIFOI</span>
            </span>
          </a>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 text-sm">
            <p><b>Phone:</b> {config?.supportPhone || "01312812139"}</p>
            {config?.supportEmail && <p className="mt-1"><b>Email:</b> {config.supportEmail}</p>}
            {config?.storeAddress && <p className="mt-1"><b>Address:</b> {config.storeAddress}</p>}
            <p className="mt-1 text-neutral-500">Support hours: 9:00 AM – 11:00 PM, every day</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-neutral-200/80 bg-white p-6">
          <h2 className="font-display text-lg font-extrabold">Send Us a Message</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-600">Your Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-600">Phone or Email *</label>
              <input value={phoneEmail} onChange={(e) => setPhoneEmail(e.target.value)} placeholder="How can we reach you?" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-600">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Order question" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-neutral-600">Message *</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Write your message…" className={inputCls} />
            </div>
            <button type="submit" disabled={sending} className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-extrabold text-white hover:bg-red-700 disabled:opacity-60">
              {sending ? "Sending…" : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
