import { db } from "@/db";
import {
  adminUsers,
  banners,
  categories,
  cmsPages,
  shippingZones,
  siteSettings,
} from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const CATS: { name: string; slug: string; order: number }[] = [
  { name: "Men's Fashion", slug: "mens-fashion", order: 1 },
  { name: "Women's Fashion", slug: "womens-fashion", order: 2 },
  { name: "Shirts", slug: "shirts", order: 3 },
  { name: "T-Shirts", slug: "t-shirts", order: 4 },
  { name: "Pants and Trousers", slug: "pants-and-trousers", order: 5 },
  { name: "Clothing", slug: "clothing", order: 6 },
  { name: "Shoes and Footwear", slug: "shoes-and-footwear", order: 7 },
  { name: "Watches", slug: "watches", order: 8 },
  { name: "Electronics", slug: "electronics", order: 9 },
  { name: "Accessories", slug: "accessories", order: 10 },
  { name: "Bags", slug: "bags", order: 11 },
  { name: "Other Products", slug: "other-products", order: 12 },
];

const PAGES: { slug: string; title: string; content: string }[] = [
  {
    slug: "about",
    title: "About Us",
    content: `RIFOI — For your needs Rifoi.\n\nRIFOI is a trusted online shopping destination in Bangladesh. We bring you quality fashion, electronics, watches, footwear and everyday essentials at fair prices, with cash on delivery available across the country.\n\nOur promise:\n• Genuine, quality-checked products\n• Fair and transparent pricing in Bangladeshi Taka (BDT)\n• Fast, careful delivery to your doorstep\n• Friendly customer support on WhatsApp: 01312812139\n• Easy returns as per our Return & Refund Policy\n\nThank you for shopping with RIFOI.`,
  },
  {
    slug: "contact",
    title: "Contact Us",
    content: `We are here to help!\n\nWhatsApp / Hotline: 01312812139\nFacebook: https://www.facebook.com/share/18MBugQQsA/\n\nSupport hours: 9:00 AM – 11:00 PM, every day.\n\nUse the contact form on this page and we will get back to you as soon as possible.`,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    content: `How do I place an order?\nBrowse products, add them to your cart, then checkout with your name, phone number and delivery address. No account needed.\n\nWhat payment methods do you accept?\nbKash, Nagad, Rocket (all to 01312812139) and Cash on Delivery.\n\nHow do manual mobile payments work?\nSend the total to our number, enter the Transaction ID at checkout, and we will verify and confirm your order.\n\nHow long does delivery take?\nInside Dhaka: usually 1–2 working days. Outside Dhaka: usually 2–4 working days.\n\nCan I return a product?\nYes, please see our Return & Refund Policy page for details.`,
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    content: `Delivery charges:\n• Inside Dhaka: ৳60\n• Outside Dhaka: ৳120\n\nDelivery time:\n• Inside Dhaka: 1–2 working days\n• Outside Dhaka: 2–4 working days\n\nOrders are processed after payment verification (for mobile payments) or confirmation call (for Cash on Delivery). Delivery times may vary during festivals and sales campaigns.`,
  },
  {
    slug: "return-policy",
    title: "Return & Refund Policy",
    content: `Changed your mind or received a problem? Here is how we help:\n\n• You may request a return within 7 days of delivery.\n• Products must be unused, unwashed and in original packaging with tags.\n• Wrong, damaged or defective items will be exchanged or refunded.\n• To start a return, contact us on WhatsApp: 01312812139 with your order reference and a photo/video of the issue.\n• Refunds for verified mobile payments are returned to the same number within 3–7 working days.\n\nSale items may have special conditions shown on the product page.`,
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content: `Your privacy matters to RIFOI.\n\nWhat we collect: your name, phone number, email (optional), delivery address and order details — only what is needed to process your order.\n\nHow we use it: to confirm, deliver and support your orders. We do not sell your personal information.\n\nPayments: manual mobile payment references are used only for verification. We never ask for your PIN or OTP.\n\nContact us anytime to update or remove your information.`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    content: `By shopping at RIFOI you agree to the following:\n\n• All prices are in Bangladeshi Taka (BDT) and include applicable charges unless stated otherwise.\n• Orders are confirmed only after verification (payment verification or confirmation call).\n• We may cancel orders in case of pricing errors, stock issues or suspected fraud, with a full refund where payment was made.\n• Product colours may vary slightly due to screen settings.\n• Placing an order via WhatsApp requires you to actively send the message; opening WhatsApp does not confirm an order.`,
  },
];

export async function seed() {
  // admin
  const adminEmail = process.env.ADMIN_EMAIL || "owner@rifoi.com";
  const adminPass = process.env.ADMIN_PASSWORD || "Rifoi@2026#Secure";
  const adminName = process.env.ADMIN_NAME || "RIFOI Owner";
  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, adminEmail))
    .limit(1);
  if (!existing.length) {
    const hash = await bcrypt.hash(adminPass, 12);
    await db.insert(adminUsers).values({
      email: adminEmail,
      passwordHash: hash,
      name: adminName,
      role: "owner",
    });
    console.log(`[seed] admin created: ${adminEmail}`);
  } else {
    console.log(`[seed] admin exists: ${adminEmail}`);
  }

  for (const c of CATS) {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, c.slug))
      .limit(1);
    if (!rows.length) {
      await db.insert(categories).values({
        name: c.name,
        slug: c.slug,
        sortOrder: c.order,
        isPublished: true,
      });
    }
  }
  console.log("[seed] categories ok");

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    if (!rows.length) {
      await db.insert(siteSettings).values({ key, value });
    }
  }
  console.log("[seed] settings ok");

  for (const p of PAGES) {
    const rows = await db
      .select()
      .from(cmsPages)
      .where(eq(cmsPages.slug, p.slug))
      .limit(1);
    if (!rows.length) {
      await db.insert(cmsPages).values(p);
    }
  }
  console.log("[seed] pages ok");

  const zones = await db.select().from(shippingZones).limit(1);
  if (!zones.length) {
    await db.insert(shippingZones).values([
      { name: "Inside Dhaka", districts: "Dhaka,Gazipur,Narayanganj", fee: 60, isActive: true },
      {
        name: "Outside Dhaka",
        districts:
          "Chattogram,Sylhet,Khulna,Rajshahi,Rangpur,Mymensingh,Barishal,Cumilla,Cox's Bazar,Bogura,Dinajpur",
        fee: 120,
        isActive: true,
      },
    ]);
  }
  console.log("[seed] shipping ok");

  const heroBanners = await db.select().from(banners).limit(1);
  if (!heroBanners.length) {
    await db.insert(banners).values([
      {
        title: "Premium Quality, Everyday Essentials",
        subtitle:
          "For your needs Rifoi — fashion, electronics, watches & more with delivery across Bangladesh.",
        ctaText: "Shop Now",
        ctaLink: "/shop",
        position: "hero",
        sortOrder: 0,
        isActive: true,
      },
      {
        title: "Cash on Delivery Available",
        subtitle: "Pay when you receive your order — anywhere in Bangladesh.",
        ctaText: "Browse Products",
        ctaLink: "/shop",
        position: "promo",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Easy Mobile Payments",
        subtitle: "bKash, Nagad & Rocket accepted on 01312812139.",
        ctaText: "How It Works",
        ctaLink: "/faq",
        position: "promo",
        sortOrder: 2,
        isActive: true,
      },
    ]);
  }
  console.log("[seed] banners ok");
}
