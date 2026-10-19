import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { clearSettingsCache, getSiteSettings } from "@/lib/settings";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set([
  "announcement", "announcementActive", "whatsappLocal", "whatsappIntl",
  "facebookUrl", "supportPhone", "supportEmail", "storeAddress",
  "deliveryDhaka", "deliveryOutside", "freeShippingThreshold",
  "bkashEnabled", "nagadEnabled", "rocketEnabled", "codEnabled",
  "bkashNumber", "nagadNumber", "rocketNumber",
  "bkashInstructions", "nagadInstructions", "rocketInstructions", "codInstructions",
  "logoUrl", "heroTitle", "heroSubtitle", "heroCtaText", "heroCtaLink", "heroImage",
  "newsletterEnabled", "metaTitle", "metaDescription",
]);

export async function GET() {
  try {
    await requireAdmin();
    const s = await getSiteSettings();
    return NextResponse.json({ settings: s });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = z.record(z.string(), z.string().max(20000)).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid settings data." }, { status: 400 });
    for (const [key, value] of Object.entries(parsed.data)) {
      if (!ALLOWED_KEYS.has(key)) continue;
      let v = value;
      if (key === "whatsappIntl") v = v.replace(/[^0-9]/g, "").slice(0, 20);
      if (["deliveryDhaka", "deliveryOutside", "freeShippingThreshold"].includes(key)) {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0) continue;
      }
      await db
        .insert(siteSettings)
        .values({ key, value: v })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value: v } });
    }
    clearSettingsCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("PUT /api/admin/settings", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
