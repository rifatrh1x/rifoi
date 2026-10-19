"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={56} />
          <h1 className="mt-4 font-display text-2xl font-extrabold">RIFOI Admin</h1>
          <p className="mt-1 text-sm text-neutral-500">Owner dashboard — sign in to manage your store</p>
        </div>
        <form onSubmit={login} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-neutral-600" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@rifoi.com"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-neutral-600" htmlFor="admin-pass">Password</label>
            <input
              id="admin-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
              required
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-400">
          Authorized access only. Your initial login email and password were provided with the project handover —
          change the password after your first login (Dashboard → Settings → Security).
        </p>
      </div>
    </div>
  );
}
