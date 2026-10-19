export const WHATSAPP_NUMBER_LOCAL = "01312812139";
export const WHATSAPP_NUMBER_INTL = "8801312812139";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER_INTL}`;
export const FACEBOOK_URL = "https://www.facebook.com/share/18MBugQQsA/";
export const BRAND_NAME = "RIFOI";
export const SLOGAN = "For your needs Rifoi";
export const CURRENCY = "৳";

export function formatPrice(amount: number): string {
  const n = Number(amount) || 0;
  return `৳${n.toLocaleString("en-BD")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

export function generateOrderRef(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `RIF-${ymd}-${rand}`;
}

export function generateSku(name: string): string {
  const prefix =
    name
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.slice(0, 3).toUpperCase())
      .join("") || "RIF";
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${rand}`;
}

export function whatsappEnquiryUrl(opts: {
  productName: string;
  productUrl: string;
  size?: string;
  color?: string;
  model?: string;
  base?: string;
}): string {
  const base = opts.base || WHATSAPP_URL;
  const lines = [
    `Hello RIFOI!`,
    `I am interested in this product:`,
    `*${opts.productName}*`,
  ];
  const variantBits: string[] = [];
  if (opts.size) variantBits.push(`Size: ${opts.size}`);
  if (opts.color) variantBits.push(`Color: ${opts.color}`);
  if (opts.model) variantBits.push(`Model: ${opts.model}`);
  if (variantBits.length) lines.push(variantBits.join(" | "));
  lines.push(opts.productUrl);
  lines.push(`Please confirm price and availability. Thank you!`);
  return `${base}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export type OrderWhatsAppItem = {
  name: string;
  variant?: string;
  qty: number;
  price: number;
};

export function orderWhatsAppUrl(opts: {
  orderRef: string;
  items: OrderWhatsAppItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  name: string;
  phone: string;
  district: string;
  address: string;
  paymentMethod: string;
  base?: string;
}): string {
  const base = opts.base || WHATSAPP_URL;
  const lines = [
    `Hello RIFOI! I just placed an order on the website.`,
    ``,
    `*Order Ref: ${opts.orderRef}*`,
    `--------------------------`,
    ...opts.items.map(
      (it) =>
        `• ${it.name}${it.variant ? ` (${it.variant})` : ""} x${it.qty} — ৳${(
          it.price * it.qty
        ).toLocaleString("en-BD")}`
    ),
    `--------------------------`,
    `Subtotal: ৳${opts.subtotal.toLocaleString("en-BD")}`,
    ...(opts.discount > 0
      ? [`Discount: -৳${opts.discount.toLocaleString("en-BD")}`]
      : []),
    `Delivery: ৳${opts.deliveryFee.toLocaleString("en-BD")}`,
    `*Total: ৳${opts.total.toLocaleString("en-BD")}*`,
    `--------------------------`,
    `Name: ${opts.name}`,
    `Phone: ${opts.phone}`,
    `District: ${opts.district}`,
    `Address: ${opts.address}`,
    `Payment: ${opts.paymentMethod}`,
    ``,
    `Please confirm my order. Thank you!`,
  ];
  return `${base}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const BD_DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria",
  "Chandpur", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla", "Dhaka",
  "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
  "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat",
  "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar",
  "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi",
  "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
  "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
  "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
  "Tangail", "Thakurgaon",
];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export const PAYMENT_METHODS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "cod", label: "Cash on Delivery" },
] as const;
