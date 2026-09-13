import {
  CONTACTED_STATUSES,
  HIGH_PRIORITY_SCORE,
  REPLIED_STATUSES,
} from "@/lib/constants";
import { listRecentActivities } from "@/lib/db/activities";
import { listPriorityCompanies } from "@/lib/db/companies";
import { AppError } from "@/lib/db/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActivityRow, CompanyRow, OutreachSequenceRow } from "@/types/database";

export type OverviewData = {
  kpis: {
    totalLeads: number;
    highPriority: number;
    contacted: number;
    replies: number;
    opportunities: number;
    conversionRate: number;
  };
  priorityProspects: CompanyRow[];
  followUps: Array<
    OutreachSequenceRow & {
      company_name: string;
      company_domain: string;
    }
  >;
  activity: ActivityRow[];
};

export async function getOverviewData(workspaceId: string): Promise<OverviewData> {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalResult,
    highPriorityResult,
    contactedResult,
    repliesResult,
    wonResult,
    lostResult,
    opportunitiesResult,
    sequencesResult,
    priorityProspects,
    activity,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("total_score", HIGH_PRIORITY_SCORE),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("status", CONTACTED_STATUSES),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("status", REPLIED_STATUSES),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "won"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "lost"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "open"),
    supabase
      .from("outreach_sequences")
      .select("*")
      .eq("workspace_id", workspaceId)
      .not("next_follow_up_at", "is", null)
      .lte("next_follow_up_at", new Date().toISOString())
      .order("next_follow_up_at", { ascending: true })
      .limit(6),
    listPriorityCompanies(workspaceId, 6),
    listRecentActivities(workspaceId, 8),
  ]);

  if (totalResult.error) {
    throw new AppError("Unable to load dashboard metrics.");
  }

  const won = wonResult.count ?? 0;
  const lost = lostResult.count ?? 0;
  const decided = won + lost;
  const sequences = sequencesResult.data ?? [];
  const companyIds = sequences.map((sequence) => sequence.company_id);
  const companies =
    companyIds.length > 0
      ? (
          await supabase
            .from("companies")
            .select("id, name, domain")
            .eq("workspace_id", workspaceId)
            .in("id", companyIds)
        ).data ?? []
      : [];
  const companyMap = new Map(companies.map((company) => [company.id, company]));

  return {
    kpis: {
      totalLeads: totalResult.count ?? 0,
      highPriority: highPriorityResult.count ?? 0,
      contacted: contactedResult.count ?? 0,
      replies: repliesResult.count ?? 0,
      opportunities: opportunitiesResult.count ?? 0,
      conversionRate: decided === 0 ? 0 : Math.round((won / decided) * 100),
    },
    priorityProspects,
    followUps: sequences.map((sequence) => ({
      ...sequence,
      company_name: companyMap.get(sequence.company_id)?.name ?? "Unknown company",
      company_domain: companyMap.get(sequence.company_id)?.domain ?? "",
    })),
    activity,
  };
}
