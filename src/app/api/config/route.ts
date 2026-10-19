import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";
import { db } from "@/db";
import { shippingZones } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const s = await getSiteSettings();
    let zones: { id: string; name: string; districts: string | null; fee: number; freeThreshold: number | null }[] = [];
    try {
      const rows = await db.select().from(shippingZones).where(eq(shippingZones.isActive, true));
      zones = rows.map((z) => ({
        id: z.id,
        name: z.name,
        districts: z.districts,
        fee: z.fee,
        freeThreshold: z.freeThreshold,
      }));
    } catch {
      zones = [];
    }
    return NextResponse.json({
      announcement: s.announcementActive === "true" ? s.announcement : "",
      whatsappLocal: s.whatsappLocal,
      whatsappIntl: s.whatsappIntl,
      whatsappUrl: `https://wa.me/${s.whatsappIntl}`,
      facebookUrl: s.facebookUrl,
      supportPhone: s.supportPhone,
      supportEmail: s.supportEmail,
      storeAddress: s.storeAddress,
      deliveryDhaka: Number(s.deliveryDhaka) || 60,
      deliveryOutside: Number(s.deliveryOutside) || 120,
      freeShippingThreshold: Number(s.freeShippingThreshold) || 0,
      payments: {
        bkash: { enabled: s.bkashEnabled === "true", number: s.bkashNumber, instructions: s.bkashInstructions },
        nagad: { enabled: s.nagadEnabled === "true", number: s.nagadNumber, instructions: s.nagadInstructions },
        rocket: { enabled: s.rocketEnabled === "true", number: s.rocketNumber, instructions: s.rocketInstructions },
        cod: { enabled: s.codEnabled === "true", instructions: s.codInstructions },
      },
      logoUrl: s.logoUrl,
      hero: { title: s.heroTitle, subtitle: s.heroSubtitle, ctaText: s.heroCtaText, ctaLink: s.heroCtaLink, image: s.heroImage },
      newsletterEnabled: s.newsletterEnabled === "true",
      zones,
    });
  } catch (e) {
    console.error("GET /api/config", e);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}
