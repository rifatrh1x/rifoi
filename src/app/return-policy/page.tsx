import InfoPage from "@/components/InfoPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Return & Refund Policy", description: "RIFOI return and refund policy." };
export const dynamic = "force-dynamic";

export default function ReturnPolicyPage() {
  return <InfoPage slug="return-policy" fallbackTitle="Return & Refund Policy" />;
}
