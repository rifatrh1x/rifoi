import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phoneEmail: z.string().trim().min(5).max(255),
  subject: z.string().trim().max(500).optional().default(""),
  message: z.string().trim().min(5).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please fill in all fields correctly.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const [row] = await db.insert(contactMessages).values(parsed.data).returning({ id: contactMessages.id });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("POST /api/contact", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
