import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        title={`${title} is scoped, not mocked.`}
        description="The data model and navigation are ready. This workspace ships after the lead foundation is stable."
      />
    </div>
  );
}
