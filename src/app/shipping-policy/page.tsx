import InfoPage from "@/components/InfoPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping Policy", description: "RIFOI shipping policy — delivery charges and timelines across Bangladesh." };
export const dynamic = "force-dynamic";

export default function ShippingPolicyPage() {
  return <InfoPage slug="shipping-policy" fallbackTitle="Shipping Policy" />;
}
