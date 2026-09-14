import { Suspense } from "react";
import { requireWorkspace } from "@/lib/auth/workspace";
import { listCompanies } from "@/lib/db/companies";
import { leadSearchSchema } from "@/lib/validation/company";
import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Leads",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspace } = await requireWorkspace();
  const raw = await searchParams;
  const parsed = leadSearchSchema.safeParse({
    q: first(raw.q),
    status: first(raw.status),
    category: first(raw.category),
    country: first(raw.country),
    score: first(raw.score),
    auditStatus: first(raw.auditStatus),
    contactStatus: first(raw.contactStatus),
    tag: first(raw.tag),
    page: first(raw.page) ?? "1",
    sort: first(raw.sort),
    order: first(raw.order),
  });
  const filters = parsed.success
    ? parsed.data
    : leadSearchSchema.parse({ page: 1 });
  const { rows, total } = await listCompanies(workspace.id, filters);

  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsWorkspace rows={rows} total={total} page={filters.page} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function LeadsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
