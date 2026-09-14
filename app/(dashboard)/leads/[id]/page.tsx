import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/auth/workspace";
import { getCompany } from "@/lib/db/companies";
import { LeadDetail } from "@/components/leads/lead-detail";

export const metadata = {
  title: "Lead",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const detail = await getCompany(workspace.id, id);

  if (!detail) {
    notFound();
  }

  return <LeadDetail detail={detail} />;
}
