import InfoPage from "@/components/InfoPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ", description: "Frequently asked questions about ordering, payments and delivery at RIFOI." };
export const dynamic = "force-dynamic";

export default function FaqPage() {
  return <InfoPage slug="faq" fallbackTitle="Frequently Asked Questions" />;
}
