import InfoPage from "@/components/InfoPage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us", description: "Learn about RIFOI — For your needs Rifoi. Quality online shopping in Bangladesh." };
export const dynamic = "force-dynamic";

export default function AboutPage() {
  return <InfoPage slug="about" fallbackTitle="About Us" />;
}
