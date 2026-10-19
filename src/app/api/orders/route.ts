import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons, customers, orderItems, orders, products, productVariants } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { generateOrderRef } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";

const itemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  qty: z.number().int().min(1).max(50),
});

const orderSchema = z.object({
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(6).max(50),
  email: z.string().trim().max(255).optional().nullable(),
  district: z.string().trim().min(2).max(255),
  area: z.string().trim().max(255).optional().nullable(),
  address: z.string().trim().min(5).max(2000),
  instructions: z.string().trim().max(2000).optional().nullable(),
  paymentMethod: z.enum(["bkash", "nagad", "rocket", "cod"]),
  transactionRef: z.string().trim().max(255).optional().nullable(),
  couponCode: z.string().trim().max(100).optional().nullable(),
  items: z.array(itemSchema).min(1).max(50),
});

function normalizePhone(p: string): string {
  return p.replace(/[\s-]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check your information and try again.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const phone = normalizePhone(d.phone);
    if (!/^[0-9+]{6,20}$/.test(phone)) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
    if (d.email && d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const settings = await getSiteSettings();
    const enabledMap: Record<string, boolean> = {
      bkash: settings.bkashEnabled === "true",
      nagad: settings.nagadEnabled === "true",
      rocket: settings.rocketEnabled === "true",
      cod: settings.codEnabled === "true",
    };
    if (!enabledMap[d.paymentMethod]) {
      return NextResponse.json({ error: "This payment method is currently unavailable." }, { status: 400 });
    }
    if (d.paymentMethod !== "cod" && !d.transactionRef?.trim()) {
      return NextResponse.json(
        { error: "Please enter your Transaction ID / reference for mobile payment." },
        { status: 400 }
      );
    }

    // Validate items + compute prices server-side
    let subtotal = 0;
    const lineItems: {
      productId: string;
      productName: string;
      variantId: string | null;
      variantLabel: string | null;
      qty: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const it of d.items) {
      const [prod] = await db.select().from(products).where(eq(products.id, it.productId)).limit(1);
      if (!prod || prod.status !== "published") {
        return NextResponse.json({ error: `A product in your cart is no longer available.` }, { status: 400 });
      }
      let unitPrice = prod.salePrice ?? prod.regularPrice;
      let variantLabel: string | null = null;
      if (it.variantId) {
        const [v] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, it.variantId))
          .limit(1);
        if (!v || v.productId !== prod.id || !v.isAvailable) {
          return NextResponse.json({ error: `Selected variant of "${prod.name}" is unavailable.` }, { status: 400 });
        }
        if (v.priceOverride != null) unitPrice = v.priceOverride;
        if (v.stockQuantity < it.qty) {
          return NextResponse.json({ error: `Only ${v.stockQuantity} pcs available for "${prod.name}".` }, { status: 400 });
        }
        const bits = [v.size, v.color, v.model].filter(Boolean);
        variantLabel = bits.length ? bits.join(" / ") : null;
      } else {
        const [count] = await db
          .select({ c: sql<number>`count(*)` })
          .from(productVariants)
          .where(eq(productVariants.productId, prod.id));
        if (Number(count?.c || 0) > 0) {
          return NextResponse.json(
            { error: `Please select size / color for "${prod.name}".` },
            { status: 400 }
          );
        }
        if (prod.stockQuantity < it.qty) {
          return NextResponse.json({ error: `Only ${prod.stockQuantity} pcs available for "${prod.name}".` }, { status: 400 });
        }
      }
      const lineTotal = unitPrice * it.qty;
      subtotal += lineTotal;
      lineItems.push({
        productId: prod.id,
        productName: prod.name,
        variantId: it.variantId || null,
        variantLabel,
        qty: it.qty,
        unitPrice,
        lineTotal,
      });
    }

    // Coupon
    let discount = 0;
    let couponCode: string | null = null;
    if (d.couponCode?.trim()) {
      const code = d.couponCode.trim().toUpperCase();
      const [cp] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
      if (!cp || !cp.isActive) {
        return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 });
      }
      if (cp.expiresAt && new Date(cp.expiresAt) < new Date()) {
        return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
      }
      if (cp.usageLimit != null && cp.usedCount >= cp.usageLimit) {
        return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
      }
      if (subtotal < cp.minOrderAmount) {
        return NextResponse.json(
          { error: `This coupon needs a minimum order of ৳${cp.minOrderAmount.toLocaleString()}.` },
          { status: 400 }
        );
      }
      discount =
        cp.discountType === "percent"
          ? Math.round((subtotal * cp.value) / 100)
          : cp.value;
      if (cp.maxDiscountAmount != null) discount = Math.min(discount, cp.maxDiscountAmount);
      discount = Math.min(discount, subtotal);
      couponCode = code;
      await db
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.id, cp.id));
    }

    // Delivery fee
    const isDhaka = /dhaka/i.test(d.district) || /dhaka/i.test(d.area || "");
    let deliveryFee = isDhaka ? Number(settings.deliveryDhaka) || 60 : Number(settings.deliveryOutside) || 120;
    const freeThreshold = Number(settings.freeShippingThreshold) || 0;
    if (freeThreshold > 0 && subtotal - discount >= freeThreshold) deliveryFee = 0;
    const total = subtotal - discount + deliveryFee;

    // Upsert customer by phone
    let customerId: string | null = null;
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);
    if (existingCustomer) {
      customerId = existingCustomer.id;
      await db
        .update(customers)
        .set({
          name: d.name.trim(),
          email: d.email?.trim() || null,
          district: d.district.trim(),
          area: d.area?.trim() || null,
          address: d.address.trim(),
        })
        .where(eq(customers.id, existingCustomer.id));
    } else {
      const [nc] = await db
        .insert(customers)
        .values({
          name: d.name.trim(),
          phone,
          email: d.email?.trim() || null,
          district: d.district.trim(),
          area: d.area?.trim() || null,
          address: d.address.trim(),
        })
        .returning({ id: customers.id });
      customerId = nc.id;
    }

    const orderRef = generateOrderRef();
    const paymentStatus = d.paymentMethod === "cod" ? "pending" : "pending_verification";
    const [order] = await db
      .insert(orders)
      .values({
        orderRef,
        customerId,
        customerName: d.name.trim(),
        customerPhone: phone,
        customerEmail: d.email?.trim() || null,
        district: d.district.trim(),
        area: d.area?.trim() || null,
        address: d.address.trim(),
        deliveryInstructions: d.instructions?.trim() || null,
        subtotal,
        discount,
        couponCode,
        deliveryFee,
        total,
        paymentMethod: d.paymentMethod,
        paymentStatus,
        transactionRef: d.transactionRef?.trim() || null,
        status: "pending",
      })
      .returning({ id: orders.id, orderRef: orders.orderRef });

    for (const li of lineItems) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: li.productId,
        productName: li.productName,
        variantInfo: li.variantLabel ? { label: li.variantLabel, variantId: li.variantId } : null,
        quantity: li.qty,
        unitPrice: li.unitPrice,
        totalPrice: li.lineTotal,
      });
      if (li.variantId) {
        await db
          .update(productVariants)
          .set({ stockQuantity: sql`GREATEST(0, ${productVariants.stockQuantity} - ${li.qty})` })
          .where(eq(productVariants.id, li.variantId));
      } else {
        await db
          .update(products)
          .set({ stockQuantity: sql`GREATEST(0, ${products.stockQuantity} - ${li.qty})` })
          .where(eq(products.id, li.productId));
      }
      await db
        .update(products)
        .set({ soldCount: sql`${products.soldCount} + ${li.qty}` })
        .where(eq(products.id, li.productId));
    }

    return NextResponse.json({
      ok: true,
      orderRef: order.orderRef,
      orderId: order.id,
      subtotal,
      discount,
      deliveryFee,
      total,
      paymentStatus,
    });
  } catch (e) {
    console.error("POST /api/orders", e);
    return NextResponse.json({ error: "Failed to place order. Please try again." }, { status: 500 });
  }
}
