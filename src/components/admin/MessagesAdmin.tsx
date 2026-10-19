"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/lib/store";
import { LoadingState } from "@/components/ui";
import { Modal, ConfirmDialog, btnGhost, inputCls } from "./AdminUI";

type Msg = {
  id: string; name: string; phoneEmail: string; subject: string | null;
  message: string; isRead: boolean; createdAt: string;
};

export default function MessagesAdmin() {
  const { push } = useToast();
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<Msg | null>(null);
  const [deleting, setDeleting] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<{ email: string; createdAt: string }[]>([]);
  const [showSubs, setShowSubs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?limit=50${unreadOnly ? "&unread=true" : ""}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setRows(d.messages);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, push]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (m: Msg, isRead: boolean) => {
    try {
      const res = await fetch(`/api/admin/messages/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      setRows((prev) => prev.map((x) => (x.id === m.id ? { ...x, isRead } : x)));
      if (selected?.id === m.id) setSelected({ ...m, isRead });
    } catch (e) {
      push(e instanceof Error ? e.message : "Update failed", "error");
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/messages/${deleting.id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      push("Message deleted", "success");
      setDeleting(null);
      setSelected(null);
      load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const loadSubs = async () => {
    try {
      const res = await fetch("/api/admin/subscribers");
      const d = await res.json();
      if (!d.error) setSubs(d.subscribers || []);
      setShowSubs(true);
    } catch {
      push("Failed to load subscribers", "error");
    }
  };

  if (loading) return <LoadingState text="Loading messages…" />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Contact Messages</h2>
          <p className="text-xs text-neutral-500">Enquiries from the Contact Us page form.</p>
        </div>
        <div className="ml-auto flex gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-bold">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="h-4 w-4 accent-red-700" />
            Unread only
          </label>
          <button onClick={loadSubs} className={`${btnGhost} !py-2`}>Newsletter List</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <p className="font-bold">No messages</p>
          <p className="mt-1 text-sm text-neutral-500">Customer enquiries will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelected(m); if (!m.isRead) mark(m, true); }}
              className={`flex w-full flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 text-left transition hover:shadow-md ${m.isRead ? "border-neutral-200/80" : "border-red-200 bg-red-50/40"}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${m.isRead ? "bg-neutral-100 text-neutral-500" : "bg-red-700 text-white"}`}>
                {m.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{m.subject || "(no subject)"} — {m.name}</span>
                <span className="block truncate text-xs text-neutral-500">{m.message}</span>
                <span className="text-[11px] text-neutral-400">{m.phoneEmail} • {new Date(m.createdAt).toLocaleString("en-GB")}</span>
              </span>
              {!m.isRead && <span className="rounded-full bg-red-700 px-2.5 py-1 text-[10px] font-bold text-white">NEW</span>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={selected.subject || "Message"} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <p className="text-sm"><b>From:</b> {selected.name} ({selected.phoneEmail})</p>
            <p className="text-xs text-neutral-400">{new Date(selected.createdAt).toLocaleString("en-GB")}</p>
            <div className="rounded-2xl bg-white p-4 text-sm leading-relaxed ring-1 ring-neutral-200 rifoi-prose">{selected.message}</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => mark(selected, !selected.isRead)} className={btnGhost}>
                Mark as {selected.isRead ? "Unread" : "Read"}
              </button>
              <button onClick={() => setDeleting(selected)} className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {showSubs && (
        <Modal title={`Newsletter Subscribers (${subs.length})`} onClose={() => setShowSubs(false)}>
          {subs.length === 0 ? (
            <p className="text-sm text-neutral-500">No subscribers yet.</p>
          ) : (
            <ul className="max-h-[50vh] divide-y divide-neutral-100 overflow-y-auto rounded-xl bg-white ring-1 ring-neutral-200">
              {subs.map((s) => (
                <li key={s.email} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="font-semibold">{s.email}</span>
                  <span className="text-xs text-neutral-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog title="Delete message?" message="This enquiry will be permanently removed." onConfirm={doDelete} onCancel={() => setDeleting(null)} busy={busy} />
      )}
    </div>
  );
}
