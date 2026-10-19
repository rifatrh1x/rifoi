import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ---------- ADMIN USERS ----------
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull().default("RIFOI Owner"),
  role: varchar("role", { length: 50 }).notNull().default("owner"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- CATEGORIES ----------
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- PRODUCTS ----------
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  sku: varchar("sku", { length: 100 }),
  categoryId: uuid("category_id"),
  brand: varchar("brand", { length: 255 }),
  description: text("description"),
  specifications: text("specifications"),
  materialCare: text("material_care"),
  regularPrice: integer("regular_price").notNull().default(0), // in BDT (taka)
  salePrice: integer("sale_price"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  availabilityStatus: varchar("availability_status", { length: 50 }).notNull().default("in_stock"),
  tags: text("tags"), // comma separated
  isFeatured: boolean("is_featured").notNull().default(false),
  isNewArrival: boolean("is_new_arrival").notNull().default(true),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft | published | archived
  shippingInfo: text("shipping_info"),
  returnInfo: text("return_info"),
  videoUrl: text("video_url"),
  metaTitle: varchar("meta_title", { length: 500 }),
  metaDescription: text("meta_description"),
  viewCount: integer("view_count").notNull().default(0),
  soldCount: integer("sold_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- PRODUCT IMAGES ----------
export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  imageUrl: text("image_url").notNull(),
  alt: varchar("alt", { length: 500 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isMain: boolean("is_main").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- PRODUCT VARIANTS ----------
export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  size: varchar("size", { length: 100 }),
  color: varchar("color", { length: 100 }),
  model: varchar("model", { length: 255 }),
  priceOverride: integer("price_override"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  sku: varchar("sku", { length: 100 }),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- COUPONS ----------
export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  discountType: varchar("discount_type", { length: 20 }).notNull().default("percent"), // percent | fixed
  value: integer("value").notNull().default(0),
  minOrderAmount: integer("min_order_amount").notNull().default(0),
  maxDiscountAmount: integer("max_discount_amount"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- CUSTOMERS ----------
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  district: varchar("district", { length: 255 }),
  area: varchar("area", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- ORDERS ----------
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderRef: varchar("order_ref", { length: 50 }).notNull().unique(),
  customerId: uuid("customer_id"),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  district: varchar("district", { length: 255 }).notNull(),
  area: varchar("area", { length: 255 }),
  address: text("address").notNull(),
  deliveryInstructions: text("delivery_instructions"),
  subtotal: integer("subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  couponCode: varchar("coupon_code", { length: 100 }),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  total: integer("total").notNull().default(0),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull().default("cod"),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("pending"),
  transactionRef: varchar("transaction_ref", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- ORDER ITEMS ----------
export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  productId: uuid("product_id"),
  productName: varchar("product_name", { length: 500 }).notNull(),
  variantInfo: jsonb("variant_info"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0),
  totalPrice: integer("total_price").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- SITE SETTINGS (key-value) ----------
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- CONTACT MESSAGES ----------
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phoneEmail: varchar("phone_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- NEWSLETTER ----------
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- BANNERS / HOMEPAGE SECTIONS ----------
export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  ctaText: varchar("cta_text", { length: 255 }),
  ctaLink: varchar("cta_link", { length: 500 }),
  position: varchar("position", { length: 50 }).notNull().default("hero"), // hero | promo | category | offer
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- CMS PAGES ----------
export const cmsPages = pgTable("cms_pages", {
  slug: varchar("slug", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------- SHIPPING ZONES ----------
export const shippingZones = pgTable("shipping_zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  districts: text("districts"), // comma separated district names
  fee: integer("fee").notNull().default(0),
  freeThreshold: integer("free_threshold"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
