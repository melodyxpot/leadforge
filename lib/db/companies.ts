import {
  HIGH_PRIORITY_SCORE,
  MEDIUM_SCORE,
  PAGE_SIZE,
  PRIORITY_SCORE,
  type LeadStatus,
} from "@/lib/constants";
import { createActivity } from "@/lib/db/activities";
import { AppError } from "@/lib/db/errors";
import { persistLeadScore } from "@/lib/db/scores";
import { createClient } from "@/lib/supabase/server";
import {
  createCompanySchema,
  domainFromCreateInput,
  type CreateCompanyInput,
  type LeadSearchInput,
} from "@/lib/validation/company";
import type {
  ActivityRow,
  CompanyRow,
  ContactRow,
  LeadScoreRow,
  OpportunityRow,
  OutreachMessageRow,
  WebsiteRow,
} from "@/types/database";

export type CompanyListItem = CompanyRow & {
  contact_count: number;
  latest_audit_status: string | null;
};

export type CompanyDetail = {
  company: CompanyRow;
  website: WebsiteRow | null;
  contacts: ContactRow[];
  score: LeadScoreRow | null;
  opportunities: OpportunityRow[];
  outreach: OutreachMessageRow[];
  activities: ActivityRow[];
};

const SCORE_RANGES = {
  priority: { gte: PRIORITY_SCORE, lte: 100 },
  high: { gte: HIGH_PRIORITY_SCORE, lte: PRIORITY_SCORE - 1 },
  medium: { gte: MEDIUM_SCORE, lte: HIGH_PRIORITY_SCORE - 1 },
  low: { gte: 0, lte: MEDIUM_SCORE - 1 },
} as const;

export async function findCompanyByDomain(
  workspaceId: string,
  domain: string,
): Promise<CompanyRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("domain", domain)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to check for an existing company.");
  }

  return data;
}

export async function createCompany(
  workspaceId: string,
  rawInput: CreateCompanyInput,
): Promise<CompanyRow> {
  const input = createCompanySchema.parse(rawInput);
  const domain = domainFromCreateInput(input);
  const existing = await findCompanyByDomain(workspaceId, domain);

  if (existing) {
    throw new AppError(
      `A company with domain ${domain} already exists in this workspace.`,
      "duplicate_company",
    );
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      domain,
      category: input.category,
      industry: input.category,
      country: input.country,
      linkedin_url: input.linkedinUrl,
      notes: input.notes,
      source: "manual",
      source_url: input.websiteUrl,
      status: "new",
      last_activity_at: now,
    })
    .select("*")
    .single();

  if (error || !company) {
    if (error?.code === "23505") {
      throw new AppError(
        `A company with domain ${domain} already exists in this workspace.`,
        "duplicate_company",
      );
    }
    throw new AppError("Unable to create the company.", "database");
  }

  const { error: websiteError } = await supabase.from("websites").insert({
    workspace_id: workspaceId,
    company_id: company.id,
    url: input.websiteUrl,
    status: "unknown",
  });

  if (websiteError) {
    throw new AppError("Company was created, but the website record failed.", "database");
  }

  const contacts: ContactRow[] = [];
  if (input.contactName || input.email || input.linkedinUrl) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        workspace_id: workspaceId,
        company_id: company.id,
        name: input.contactName ?? input.name,
        role: input.contactRole,
        email: input.email,
        linkedin_url: input.linkedinUrl,
        confidence: 0.7,
      })
      .select("*")
      .single();

    if (contactError) {
      throw new AppError("Company was created, but the contact could not be saved.", "database");
    }

    if (contact) {
      contacts.push(contact);
    }
  }

  const scoredCompany = await persistLeadScore(workspaceId, company, contacts);
  await createActivity({
    workspaceId,
    companyId: company.id,
    type: "company_created",
    description: `Added ${company.name} (${domain})`,
    metadata: { source: "manual" },
  });

  if (contacts[0]) {
    await createActivity({
      workspaceId,
      companyId: company.id,
      type: "contact_added",
      description: `Added contact ${contacts[0].name}`,
    });
  }

  return { ...company, total_score: scoredCompany.total_score };
}

export async function listCompanies(
  workspaceId: string,
  filters: LeadSearchInput,
): Promise<{ rows: CompanyListItem[]; total: number }> {
  const supabase = await createClient();
  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("companies")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId);

  if (filters.q) {
    const term = filters.q.replace(/[%_,]/g, " ").trim();
    if (term) {
      const contactMatches = await supabase
        .from("contacts")
        .select("company_id")
        .eq("workspace_id", workspaceId)
        .or(`name.ilike.%${term}%,email.ilike.%${term}%`);

      const contactCompanyIds = (contactMatches.data ?? []).map(
        (row) => row.company_id,
      );
      const orFilters = [
        `name.ilike.%${term}%`,
        `domain.ilike.%${term}%`,
      ];
      if (contactCompanyIds.length > 0) {
        orFilters.push(`id.in.(${contactCompanyIds.join(",")})`);
      }
      query = query.or(orFilters.join(","));
    }
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.country) {
    query = query.ilike("country", filters.country);
  }
  if (filters.score) {
    const range = SCORE_RANGES[filters.score];
    query = query.gte("total_score", range.gte).lte("total_score", range.lte);
  }

  const sortColumn =
    filters.sort === "name"
      ? "name"
      : filters.sort === "created_at"
        ? "created_at"
        : filters.sort === "last_activity"
          ? "last_activity_at"
          : "total_score";

  query = query
    .order(sortColumn, { ascending: filters.order === "asc", nullsFirst: false })
    .range(from, to);

  const { data, count, error } = await query;
  if (error) {
    throw new AppError("Unable to load leads.");
  }

  const companies = data ?? [];
  const ids = companies.map((company) => company.id);
  const contactCounts = new Map<string, number>();
  const auditStatuses = new Map<string, string>();

  if (ids.length > 0) {
    const [{ data: contacts }, { data: audits }] = await Promise.all([
      supabase
        .from("contacts")
        .select("company_id")
        .eq("workspace_id", workspaceId)
        .in("company_id", ids),
      supabase
        .from("audits")
        .select("company_id, status, created_at")
        .eq("workspace_id", workspaceId)
        .in("company_id", ids)
        .order("created_at", { ascending: false }),
    ]);

    for (const contact of contacts ?? []) {
      contactCounts.set(
        contact.company_id,
        (contactCounts.get(contact.company_id) ?? 0) + 1,
      );
    }
    for (const audit of audits ?? []) {
      if (!auditStatuses.has(audit.company_id)) {
        auditStatuses.set(audit.company_id, audit.status);
      }
    }
  }

  let rows: CompanyListItem[] = companies.map((company) => ({
    ...company,
    contact_count: contactCounts.get(company.id) ?? 0,
    latest_audit_status: auditStatuses.get(company.id) ?? null,
  }));

  if (filters.contactStatus === "has_contact") {
    rows = rows.filter((row) => row.contact_count > 0);
  }
  if (filters.contactStatus === "missing_contact") {
    rows = rows.filter((row) => row.contact_count === 0);
  }
  if (filters.auditStatus === "none") {
    rows = rows.filter((row) => !row.latest_audit_status);
  } else if (filters.auditStatus) {
    rows = rows.filter((row) => row.latest_audit_status === filters.auditStatus);
  }

  return { rows, total: count ?? rows.length };
}

export async function getCompany(
  workspaceId: string,
  companyId: string,
): Promise<CompanyDetail | null> {
  const supabase = await createClient();
  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    throw new AppError("Unable to load this lead.");
  }
  if (!company) {
    return null;
  }

  const [
    { data: website },
    { data: contacts },
    { data: score },
    { data: opportunities },
    { data: outreach },
    { data: activities },
  ] = await Promise.all([
    supabase
      .from("websites")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("contacts").select("*").eq("company_id", companyId),
    supabase
      .from("lead_scores")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("opportunities")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("outreach_messages")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    company,
    website: website ?? null,
    contacts: contacts ?? [],
    score: score ?? null,
    opportunities: opportunities ?? [],
    outreach: outreach ?? [],
    activities: activities ?? [],
  };
}

export async function updateLeadStatus(
  workspaceId: string,
  companyId: string,
  status: LeadStatus,
): Promise<CompanyRow> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("companies")
    .select("status, name")
    .eq("workspace_id", workspaceId)
    .eq("id", companyId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("companies")
    .update({ status })
    .eq("workspace_id", workspaceId)
    .eq("id", companyId)
    .select("*")
    .single();

  if (error || !data) {
    throw new AppError("Unable to update lead status.");
  }

  await createActivity({
    workspaceId,
    companyId,
    type: "status_changed",
    description: `Status changed from ${current?.status ?? "unknown"} to ${status}`,
    metadata: { from: current?.status ?? null, to: status },
  });

  return data;
}

export async function listPriorityCompanies(
  workspaceId: string,
  limit = 6,
): Promise<CompanyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("total_score", { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError("Unable to load priority prospects.");
  }

  return data ?? [];
}

export async function searchCompanies(
  workspaceId: string,
  query: string,
  limit = 8,
): Promise<Pick<CompanyRow, "id" | "name" | "domain" | "total_score">[]> {
  const supabase = await createClient();
  const term = query.replace(/[%_,]/g, " ").trim();
  if (!term) {
    return [];
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, name, domain, total_score")
    .eq("workspace_id", workspaceId)
    .or(`name.ilike.%${term}%,domain.ilike.%${term}%`)
    .order("total_score", { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError("Unable to search leads.");
  }

  return data ?? [];
}

export async function addCompanyTags(
  workspaceId: string,
  companyIds: string[],
  tagName: string,
): Promise<void> {
  const name = tagName.trim().toLowerCase();
  if (!name || companyIds.length === 0) {
    return;
  }

  const supabase = await createClient();
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .upsert({ workspace_id: workspaceId, name }, { onConflict: "workspace_id,name" })
    .select("*")
    .single();

  if (tagError || !tag) {
    throw new AppError("Unable to create tag.");
  }

  const { error } = await supabase.from("company_tags").upsert(
    companyIds.map((companyId) => ({
      company_id: companyId,
      tag_id: tag.id,
      workspace_id: workspaceId,
    })),
    { onConflict: "company_id,tag_id" },
  );

  if (error) {
    throw new AppError("Unable to tag selected leads.");
  }

  for (const companyId of companyIds) {
    await createActivity({
      workspaceId,
      companyId,
      type: "tag_added",
      description: `Tagged as ${name}`,
    });
  }
}

export async function queueWebsiteAudits(
  workspaceId: string,
  companyIds: string[],
): Promise<number> {
  const supabase = await createClient();
  const { data: websites } = await supabase
    .from("websites")
    .select("id, company_id, url")
    .eq("workspace_id", workspaceId)
    .in("company_id", companyIds);

  const jobs = (websites ?? []).map((website) => ({
    workspace_id: workspaceId,
    type: "audit_website" as const,
    status: "queued" as const,
    payload: {
      companyId: website.company_id,
      websiteId: website.id,
      url: website.url,
    },
    idempotency_key: `audit_website:${website.id}`,
  }));

  if (jobs.length === 0) {
    return 0;
  }

  const { error } = await supabase.from("jobs").upsert(jobs, {
    onConflict: "workspace_id,idempotency_key",
    ignoreDuplicates: true,
  });

  if (error) {
    throw new AppError("Unable to queue website audits.");
  }

  return jobs.length;
}
