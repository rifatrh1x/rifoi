import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { put } from "@vercel/blob";
import { extname } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const files = form.getAll("files");
    const single = form.get("file");
    const list: File[] = [];
    for (const f of files) if (f instanceof File) list.push(f);
    if (single instanceof File && !list.length) list.push(single);
    if (!list.length) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    if (list.length > 10) return NextResponse.json({ error: "Upload max 10 images at once." }, { status: 400 });

    const urls: string[] = [];
    for (const file of list) {
      if (!ALLOWED.has(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Use JPG, PNG, WEBP or GIF.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `${file.name} is larger than 4MB.` }, { status: 400 });
      }
      const ext = extname(file.name).toLowerCase() || ".jpg";
      const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
      const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${safeExt}`;
      const blob = await put(`uploads/${filename}`, file, {
        access: "public",
        contentType: file.type,
      });
      urls.push(blob.url);
    }
    return NextResponse.json({ ok: true, urls });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error("POST /api/admin/upload", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}