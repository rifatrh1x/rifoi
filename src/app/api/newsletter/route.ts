import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = z.object({ email: z.string().trim().email().max(255) }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    await db
      .insert(newsletterSubscribers)
      .values({ email: parsed.data.email.toLowerCase() })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/newsletter", e);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
