import InfoPage from "@/components/InfoPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", description: "RIFOI privacy policy — how we protect your information." };
export const dynamic = "force-dynamic";

export default function PrivacyPolicyPage() {
  return <InfoPage slug="privacy-policy" fallbackTitle="Privacy Policy" />;
}
