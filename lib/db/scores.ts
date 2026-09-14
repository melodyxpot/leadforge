import { calculateLeadScore, type ScoringSignals } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import type { CompanyRow, ContactRow, LeadScoreRow } from "@/types/database";

export async function persistLeadScore(
  workspaceId: string,
  company: CompanyRow,
  contacts: Pick<
    ContactRow,
    "name" | "email" | "linkedin_url" | "role"
  >[] = [],
): Promise<LeadScoreRow> {
  const supabase = await createClient();
  const signals: ScoringSignals = {
    category: company.category,
    country: company.country,
    description: company.description,
    companySize: company.company_size,
    linkedinUrl: company.linkedin_url,
    notes: company.notes,
    hasContactName: contacts.some((contact) => Boolean(contact.name)),
    hasContactEmail: contacts.some((contact) => Boolean(contact.email)),
    hasContactLinkedin: contacts.some((contact) => Boolean(contact.linkedin_url)),
    hasContactRole: contacts.some((contact) => Boolean(contact.role)),
    hasAudit: false,
  };

  const breakdown = calculateLeadScore(signals);
  const { data, error } = await supabase
    .from("lead_scores")
    .insert({
      workspace_id: workspaceId,
      company_id: company.id,
      business_fit: breakdown.businessFit,
      website_opportunity: breakdown.websiteOpportunity,
      commercial_potential: breakdown.commercialPotential,
      contactability: breakdown.contactability,
      growth_signals: breakdown.growthSignals,
      data_confidence: breakdown.dataConfidence,
      total_score: breakdown.total,
      reasoning: breakdown.reasons,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to save lead score.");
  }

  await supabase
    .from("companies")
    .update({ total_score: breakdown.total })
    .eq("id", company.id)
    .eq("workspace_id", workspaceId);

  return data;
}

export async function getLatestLeadScore(
  workspaceId: string,
  companyId: string,
): Promise<LeadScoreRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_scores")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
