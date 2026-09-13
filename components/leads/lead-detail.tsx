"use client";

import Link from "next/link";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { updateLeadStatusAction } from "@/lib/actions/leads";
import {
  COMPANY_CATEGORY_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  SCORE_BAND_LABELS,
} from "@/lib/constants";
import type { CompanyDetail } from "@/lib/db/companies";
import { scoreBand, type ScoreReason } from "@/lib/scoring";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ScoreBadge } from "@/components/leads/score-badge";
import { StatusBadge } from "@/components/leads/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LeadDetail({ detail }: { detail: CompanyDetail }) {
  const { company, website, contacts, score, opportunities, outreach, activities } =
    detail;
  const [pending, startTransition] = useTransition();
  const reasons = (score?.reasoning ?? []) as ScoreReason[];
  const why = reasons.flatMap((reason) => reason.reasons).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight">{company.name}</h1>
            <StatusBadge status={company.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <a
              href={website?.url ?? `https://${company.domain}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono hover:text-foreground"
            >
              {company.domain}
            </a>
            <span>{COMPANY_CATEGORY_LABELS[company.category]}</span>
            {company.country ? <span>{company.country}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ScoreBadge score={company.total_score} />
          <Select
            value={company.status}
            disabled={pending}
            onValueChange={(status) =>
              startTransition(async () => {
                const result = await updateLeadStatusAction({
                  companyId: company.id,
                  status,
                });
                if (!result.ok) {
                  toast.error(result.error);
                }
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Lead score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-mono text-4xl tabular-nums">
                    {company.total_score}
                    <span className="text-lg text-muted-foreground"> / 100</span>
                  </div>
                  <p className="mt-1 text-sm uppercase text-muted-foreground">
                    {SCORE_BAND_LABELS[scoreBand(company.total_score)]}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium">Why this lead?</h3>
                  {why.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Score reasons will appear after the first calculation.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {why.map((reason) => (
                        <li key={reason}>• {reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium">Recommended service</h3>
                  <p className="text-sm text-muted-foreground">
                    {company.recommended_service ??
                      "Website audit is required before recommending a specific service."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No contact yet. Add one when you find a name worth writing to.
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="space-y-1 text-sm">
                      <div className="font-medium">{contact.name}</div>
                      {contact.role ? (
                        <div className="text-muted-foreground">{contact.role}</div>
                      ) : null}
                      {contact.email ? (
                        <div className="font-mono text-muted-foreground">
                          {contact.email}
                        </div>
                      ) : null}
                      {contact.linkedin_url ? (
                        <a
                          href={contact.linkedin_url}
                          className="text-muted-foreground hover:text-foreground"
                          target="_blank"
                          rel="noreferrer"
                        >
                          LinkedIn
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                activities.slice(0, 6).map((item) => (
                  <div key={item.id}>
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
        </TabsContent>

        <TabsContent value="website">
          <EmptyState
            title="Website audit comes next"
            description="Crawling, Lighthouse, and technical evidence are Phase 3. The website URL is already stored."
            action={
              <Button asChild variant="outline">
                <Link href="/audits">Open audits</Link>
              </Button>
            }
          />
          {website ? (
            <p className="mt-4 font-mono text-sm text-muted-foreground">
              Stored URL: {website.url}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="opportunities">
          {opportunities.length === 0 ? (
            <EmptyState
              title="No opportunities yet"
              description="Opportunities are created from audit evidence, not guesses."
            />
          ) : (
            <div className="space-y-3">
              {opportunities.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {item.business_impact}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outreach">
          {outreach.length === 0 ? (
            <EmptyState
              title="No outreach drafts yet"
              description="Personalized sequences will be generated from evidence in Phase 5."
              action={
                <Button asChild variant="outline">
                  <Link href="/outreach">Open outreach</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {outreach.map((message) => (
                <Card key={message.id}>
                  <CardHeader>
                    <CardTitle>{message.subject ?? message.step}</CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {message.body}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {activities.length === 0 ? (
            <EmptyState
              title="No activity"
              description="Status changes, contacts, and audits will appear in this timeline."
            />
          ) : (
            <div className="space-y-4">
              {activities.map((item) => (
                <div key={item.id} className="border-l border-border pl-4">
                  <p className="text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
