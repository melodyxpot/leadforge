import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Discovery" };

export default function DiscoveryPage() {
  return (
    <ComingSoon
      title="Discovery"
      description="Import companies from CSV, pasted URLs, and future public sources without creating duplicates."
    />
  );
}
