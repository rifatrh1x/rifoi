import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FACEBOOK_URL, WHATSAPP_NUMBER_INTL, WHATSAPP_NUMBER_LOCAL } from "./utils";

export type SiteConfig = {
  announcement: string;
  announcementActive: string;
  whatsappLocal: string;
  whatsappIntl: string;
  facebookUrl: string;
  supportPhone: string;
  supportEmail: string;
  storeAddress: string;
  deliveryDhaka: string;
  deliveryOutside: string;
  freeShippingThreshold: string;
  bkashEnabled: string;
  nagadEnabled: string;
  rocketEnabled: string;
  codEnabled: string;
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  bkashInstructions: string;
  nagadInstructions: string;
  rocketInstructions: string;
  codInstructions: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroImage: string;
  newsletterEnabled: string;
  metaTitle: string;
  metaDescription: string;
};

export const DEFAULT_SETTINGS: SiteConfig = {
  announcement: "Cash on Delivery available all over Bangladesh | Hotline: 01312812139",
  announcementActive: "true",
  whatsappLocal: WHATSAPP_NUMBER_LOCAL,
  whatsappIntl: WHATSAPP_NUMBER_INTL,
  facebookUrl: FACEBOOK_URL,
  supportPhone: WHATSAPP_NUMBER_LOCAL,
  supportEmail: "support@rifoi.com",
  storeAddress: "Dhaka, Bangladesh (update from Admin → Settings)",
  deliveryDhaka: "60",
  deliveryOutside: "120",
  freeShippingThreshold: "0",
  bkashEnabled: "true",
  nagadEnabled: "true",
  rocketEnabled: "true",
  codEnabled: "true",
  bkashNumber: WHATSAPP_NUMBER_LOCAL,
  nagadNumber: WHATSAPP_NUMBER_LOCAL,
  rocketNumber: WHATSAPP_NUMBER_LOCAL,
  bkashInstructions:
    "1. Go to your bKash app → Send Money.\n2. Send the total amount to 01312812139.\n3. Enter the Transaction ID (TrxID) in the checkout field.\n4. Your order will be confirmed after we verify the payment.",
  nagadInstructions:
    "1. Go to your Nagad app → Send Money.\n2. Send the total amount to 01312812139.\n3. Enter the Transaction ID in the checkout field.\n4. Your order will be confirmed after we verify the payment.",
  rocketInstructions:
    "1. Go to your Rocket app → Send Money.\n2. Send the total amount to 01312812139.\n3. Enter the Transaction ID in the checkout field.\n4. Your order will be confirmed after we verify the payment.",
  codInstructions:
    "Pay in cash when you receive your order. Please keep the exact amount ready.",
  logoUrl: "",
  heroTitle: "Premium Quality, Everyday Essentials",
  heroSubtitle: "For your needs Rifoi — shop fashion, electronics, watches & more with fast delivery across Bangladesh.",
  heroCtaText: "Shop Now",
  heroCtaLink: "/shop",
  heroImage: "",
  newsletterEnabled: "true",
  metaTitle: "RIFOI — For your needs Rifoi | Online Shopping in Bangladesh",
  metaDescription:
    "RIFOI is your trusted online shop in Bangladesh. Fashion, electronics, watches, shoes & more with cash on delivery.",
};

const cache: { data: SiteConfig | null; at: number } = { data: null, at: 0 };

export async function getSiteSettings(): Promise<SiteConfig> {
  if (cache.data && Date.now() - cache.at < 30_000) return cache.data;
  try {
    const rows = await db.select().from(siteSettings);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value ?? "";
    const merged = { ...DEFAULT_SETTINGS, ...map } as SiteConfig;
    cache.data = merged;
    cache.at = Date.now();
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setSiteSetting(key: string, value: string) {
  cache.data = null;
  const existing = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  if (existing.length) {
    await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
  } else {
    await db.insert(siteSettings).values({ key, value });
  }
}

export function clearSettingsCache() {
  cache.data = null;
}
