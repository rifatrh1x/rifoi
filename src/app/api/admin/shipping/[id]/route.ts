import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shippingZones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = z
      .object({
        name: z.string().trim().min(2).max(255),
        districts: z.string().max(5000).optional().nullable(),
        fee: z.number().int().min(0).max(100000),
        freeThreshold: z.number().int().min(0).max(10000000).optional().nullable(),
        isActive: z.boolean(),
      })
      .safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid zone data." }, { status: 400 });
    const d = parsed.data;
    await db
      .update(shippingZones)
      .set({
        name: d.name.trim(),
        districts: d.districts?.trim() || null,
        fee: d.fee,
        freeThreshold: d.freeThreshold ?? null,
        isActive: d.isActive,
      })
      .where(eq(shippingZones.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to update zone" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.delete(shippingZones).where(eq(shippingZones.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete zone" }, { status: 500 });
  }
}
