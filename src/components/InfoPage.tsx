import { db } from "@/db";
import { cmsPages } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function InfoPage({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
  let title = fallbackTitle;
  let content = "Content is being prepared. Please check back soon, or contact us on WhatsApp for help.";
  try {
    const rows = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug)).limit(1);
    if (rows.length) {
      title = rows[0].title;
      content = rows[0].content || content;
    }
  } catch {}

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 flex items-center gap-2 text-xs text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-red-700">Home</Link>
        <span>/</span>
        <span className="font-semibold text-neutral-700">{title}</span>
      </nav>
      <h1 className="font-display text-2xl font-extrabold md:text-3xl">{title}</h1>
      <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-white p-6 md:p-8">
        <div className="rifoi-prose text-[15px] text-neutral-700">{content}</div>
      </div>
    </div>
  );
}
