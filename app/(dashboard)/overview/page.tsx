import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireWorkspace } from "@/lib/auth/workspace";
import { getOverviewData } from "@/lib/db/overview";
import { COMPANY_CATEGORY_LABELS } from "@/lib/constants";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ScoreBadge } from "@/components/leads/score-badge";
import { StatusBadge } from "@/components/leads/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Overview",
};

export default async function OverviewPage() {
  const { workspace } = await requireWorkspace();
  const data = await getOverviewData(workspace.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="What you have, who to work next, and what is due today."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Kpi label="Total leads" value={data.kpis.totalLeads} />
        <Kpi label="High priority" value={data.kpis.highPriority} />
        <Kpi label="Contacted" value={data.kpis.contacted} />
        <Kpi label="Replies" value={data.kpis.replies} />
        <Kpi label="Opportunities" value={data.kpis.opportunities} />
        <Kpi label="Conversion rate" value={`${data.kpis.conversionRate}%`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Priority prospects</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/leads">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {data.priorityProspects.length === 0 ? (
              <EmptyState
                title="No leads yet."
                description="Add your first prospect and let LeadForge analyze the opportunity."
                action={
                  <Button asChild>
                    <Link href="/leads">Add lead</Link>
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.priorityProspects.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="font-medium">{company.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {company.domain}
                        </div>
                      </TableCell>
                      <TableCell>
                        {COMPANY_CATEGORY_LABELS[company.category]}
                      </TableCell>
                      <TableCell>
                        <ScoreBadge score={company.total_score} />
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {company.recommended_service || "Needs audit"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={company.status} />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/leads/${company.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups due</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing due today. Outreach follow-ups will appear here once you start sequences.
                </p>
              ) : (
                data.followUps.map((item) => (
                  <Link
                    key={item.id}
                    href={`/leads/${item.company_id}`}
                    className="block rounded-lg border border-border px-3 py-2 hover:bg-muted"
                  >
                    <div className="text-sm font-medium">{item.company_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.company_domain} · due{" "}
                      {item.next_follow_up_at
                        ? formatDistanceToNow(new Date(item.next_follow_up_at), {
                            addSuffix: true,
                          })
                        : "now"}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Activity will show audits, scores, contacts, and status changes.
                </p>
              ) : (
                data.activity.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="px-4 py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 font-mono text-2xl tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
