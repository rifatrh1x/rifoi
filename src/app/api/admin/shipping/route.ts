import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shippingZones } from "@/db/schema";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(shippingZones);
    return NextResponse.json({ zones: rows });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to load zones" }, { status: 500 });
  }
}

const schema = z.object({
  name: z.string().trim().min(2).max(255),
  districts: z.string().max(5000).optional().nullable(),
  fee: z.number().int().min(0).max(100000),
  freeThreshold: z.number().int().min(0).max(10000000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid zone data." }, { status: 400 });
    const d = parsed.data;
    const [row] = await db
      .insert(shippingZones)
      .values({
        name: d.name.trim(),
        districts: d.districts?.trim() || null,
        fee: d.fee,
        freeThreshold: d.freeThreshold ?? null,
        isActive: d.isActive,
      })
      .returning({ id: shippingZones.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to create zone" }, { status: 500 });
  }
}
