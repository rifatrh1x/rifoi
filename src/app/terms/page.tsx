import InfoPage from "@/components/InfoPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions", description: "RIFOI terms and conditions." };
export const dynamic = "force-dynamic";

export default function TermsPage() {
  return <InfoPage slug="terms" fallbackTitle="Terms & Conditions" />;
}
