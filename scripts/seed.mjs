import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;
const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
const pool = new Pool({ connectionString: url });

const adminEmail = process.env.ADMIN_EMAIL || "owner@rifoi.com";
const adminPass = process.env.ADMIN_PASSWORD || "Rifoi@2026#Secure";
const adminName = process.env.ADMIN_NAME || "RIFOI Owner";

const CATS = [
  ["Men's Fashion", "mens-fashion", 1],
  ["Women's Fashion", "womens-fashion", 2],
  ["Shirts", "shirts", 3],
  ["T-Shirts", "t-shirts", 4],
  ["Pants and Trousers", "pants-and-trousers", 5],
  ["Clothing", "clothing", 6],
  ["Shoes and Footwear", "shoes-and-footwear", 7],
  ["Watches", "watches", 8],
  ["Electronics", "electronics", 9],
  ["Accessories", "accessories", 10],
  ["Bags", "bags", 11],
  ["Other Products", "other-products", 12],
];

const SETTINGS = {
  announcement: "Cash on Delivery available all over Bangladesh | Hotline: 01312812139",
  announcementActive: "true",
  whatsappLocal: "01312812139",
  whatsappIntl: "8801312812139",
  facebookUrl: "https://www.facebook.com/share/18MBugQQsA/",
  supportPhone: "01312812139",
  supportEmail: "support@rifoi.com",
  storeAddress: "Dhaka, Bangladesh (update from Admin → Settings)",
  deliveryDhaka: "60",
  deliveryOutside: "120",
  freeShippingThreshold: "0",
  bkashEnabled: "true",
  nagadEnabled: "true",
  rocketEnabled: "true",
  codEnabled: "true",
  bkashNumber: "01312812139",
  nagadNumber: "01312812139",
  rocketNumber: "01312812139",
  bkashInstructions: "1. Go to your bKash app → Send Money.\n2. Send the total amount to 01312812139.\n3. Enter the Transaction ID (TrxID) in the checkout field.\n4. Your order will be confirmed after we verify the payment.",
  nagadInstructions: "1. Go to your Nagad app → Send Money.\n2. Send the total amount to 01312812139.\n3. Enter the Transaction ID in the checkout field.\n4. Your order will be confirmed after we verify the payment.",
  rocketInstructions: "1. Go to your Rocket app → Send Money.\n2. Send the total amount to 01312812139.\n3. Enter the Transaction ID in the checkout field.\n4. Your order will be confirmed after we verify the payment.",
  codInstructions: "Pay in cash when you receive your order. Please keep the exact amount ready.",
  logoUrl: "",
  heroTitle: "Premium Quality, Everyday Essentials",
  heroSubtitle: "For your needs Rifoi — shop fashion, electronics, watches & more with fast delivery across Bangladesh.",
  heroCtaText: "Shop Now",
  heroCtaLink: "/shop",
  heroImage: "",
  newsletterEnabled: "true",
  metaTitle: "RIFOI — For your needs Rifoi | Online Shopping in Bangladesh",
  metaDescription: "RIFOI is your trusted online shop in Bangladesh. Fashion, electronics, watches, shoes & more with cash on delivery.",
};

const PAGES = [
  ["about", "About Us", "RIFOI — For your needs Rifoi.\n\nRIFOI is a trusted online shopping destination in Bangladesh. We bring you quality fashion, electronics, watches, footwear and everyday essentials at fair prices, with cash on delivery available across the country.\n\nOur promise:\n• Genuine, quality-checked products\n• Fair and transparent pricing in Bangladeshi Taka (BDT)\n• Fast, careful delivery to your doorstep\n• Friendly customer support on WhatsApp: 01312812139\n• Easy returns as per our Return & Refund Policy\n\nThank you for shopping with RIFOI."],
  ["contact", "Contact Us", "We are here to help!\n\nWhatsApp / Hotline: 01312812139\nFacebook: https://www.facebook.com/share/18MBugQQsA/\n\nSupport hours: 9:00 AM – 11:00 PM, every day.\n\nUse the contact form on this page and we will get back to you as soon as possible."],
  ["faq", "Frequently Asked Questions", "How do I place an order?\nBrowse products, add them to your cart, then checkout with your name, phone number and delivery address. No account needed.\n\nWhat payment methods do you accept?\nbKash, Nagad, Rocket (all to 01312812139) and Cash on Delivery.\n\nHow do manual mobile payments work?\nSend the total to our number, enter the Transaction ID at checkout, and we will verify and confirm your order.\n\nHow long does delivery take?\nInside Dhaka: usually 1–2 working days. Outside Dhaka: usually 2–4 working days.\n\nCan I return a product?\nYes, please see our Return & Refund Policy page for details."],
  ["shipping-policy", "Shipping Policy", "Delivery charges:\n• Inside Dhaka: ৳60\n• Outside Dhaka: ৳120\n\nDelivery time:\n• Inside Dhaka: 1–2 working days\n• Outside Dhaka: 2–4 working days\n\nOrders are processed after payment verification (for mobile payments) or confirmation call (for Cash on Delivery). Delivery times may vary during festivals and sales campaigns."],
  ["return-policy", "Return & Refund Policy", "Changed your mind or received a problem? Here is how we help:\n\n• You may request a return within 7 days of delivery.\n• Products must be unused, unwashed and in original packaging with tags.\n• Wrong, damaged or defective items will be exchanged or refunded.\n• To start a return, contact us on WhatsApp: 01312812139 with your order reference and a photo/video of the issue.\n• Refunds for verified mobile payments are returned to the same number within 3–7 working days.\n\nSale items may have special conditions shown on the product page."],
  ["privacy-policy", "Privacy Policy", "Your privacy matters to RIFOI.\n\nWhat we collect: your name, phone number, email (optional), delivery address and order details — only what is needed to process your order.\n\nHow we use it: to confirm, deliver and support your orders. We do not sell your personal information.\n\nPayments: manual mobile payment references are used only for verification. We never ask for your PIN or OTP.\n\nContact us anytime to update or remove your information."],
  ["terms", "Terms & Conditions", "By shopping at RIFOI you agree to the following:\n\n• All prices are in Bangladeshi Taka (BDT) and include applicable charges unless stated otherwise.\n• Orders are confirmed only after verification (payment verification or confirmation call).\n• We may cancel orders in case of pricing errors, stock issues or suspected fraud, with a full refund where payment was made.\n• Product colours may vary slightly due to screen settings.\n• Placing an order via WhatsApp requires you to actively send the message; opening WhatsApp does not confirm an order."],
];

async function main() {
  const c = await pool.connect();
  try {
    const ex = await c.query("SELECT id FROM admin_users WHERE email=$1", [adminEmail]);
    if (ex.rows.length === 0) {
      const hash = await bcrypt.hash(adminPass, 12);
      await c.query("INSERT INTO admin_users (email, password_hash, name, role) VALUES ($1,$2,$3,'owner')", [adminEmail, hash, adminName]);
      console.log("[seed] admin created:", adminEmail);
    } else console.log("[seed] admin exists:", adminEmail);

    for (const [name, slug, order] of CATS) {
      await c.query(
        "INSERT INTO categories (name, slug, sort_order, is_published) VALUES ($1,$2,$3,true) ON CONFLICT (slug) DO NOTHING",
        [name, slug, order]
      );
    }
    console.log("[seed] categories ok");

    for (const [k, v] of Object.entries(SETTINGS)) {
      await c.query(
        "INSERT INTO site_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING",
        [k, v]
      );
    }
    console.log("[seed] settings ok");

    for (const [slug, title, content] of PAGES) {
      await c.query(
        "INSERT INTO cms_pages (slug, title, content) VALUES ($1,$2,$3) ON CONFLICT (slug) DO NOTHING",
        [slug, title, content]
      );
    }
    console.log("[seed] pages ok");

    const z = await c.query("SELECT id FROM shipping_zones LIMIT 1");
    if (z.rows.length === 0) {
      await c.query("INSERT INTO shipping_zones (name, districts, fee, is_active) VALUES ('Inside Dhaka','Dhaka,Gazipur,Narayanganj',60,true), ('Outside Dhaka','Chattogram,Sylhet,Khulna,Rajshahi,Rangpur,Mymensingh,Barishal,Cumilla',120,true)");
    }
    console.log("[seed] shipping ok");

    const b = await c.query("SELECT id FROM banners LIMIT 1");
    if (b.rows.length === 0) {
      await c.query(
        `INSERT INTO banners (title, subtitle, cta_text, cta_link, position, sort_order, is_active) VALUES
        ('Premium Quality, Everyday Essentials','For your needs Rifoi — fashion, electronics, watches & more with delivery across Bangladesh.','Shop Now','/shop','hero',0,true),
        ('Cash on Delivery Available','Pay when you receive your order — anywhere in Bangladesh.','Browse Products','/shop','promo',1,true),
        ('Easy Mobile Payments','bKash, Nagad & Rocket accepted on 01312812139.','How It Works','/faq','promo',2,true)`
      );
    }
    console.log("[seed] banners ok");
  } finally {
    c.release();
    await pool.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
