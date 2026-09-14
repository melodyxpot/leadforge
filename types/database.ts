import type {
  AuditStatus,
  CompanyCategory,
  CompanySource,
  LeadStatus,
  WebsiteStatus,
} from "@/lib/constants";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WorkspaceRole = "owner" | "member";
export type FindingSeverity = "low" | "medium" | "high" | "critical";
export type OpportunityPriority = "low" | "medium" | "high";
export type OpportunityStatus = "open" | "in_progress" | "won" | "dismissed";
export type OutreachChannel = "email" | "linkedin" | "other";
export type OutreachStatus =
  | "draft"
  | "to_contact"
  | "sent"
  | "replied"
  | "meeting"
  | "proposal"
  | "won"
  | "lost"
  | "nurture";
export type OutreachStep = "initial" | "follow_up_1" | "follow_up_2" | "final";
export type JobType =
  | "audit_website"
  | "analyze_audit"
  | "generate_opportunities"
  | "calculate_lead_score"
  | "generate_outreach";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type ActivityType =
  | "company_created"
  | "company_updated"
  | "status_changed"
  | "contact_added"
  | "audit_completed"
  | "score_updated"
  | "outreach_generated"
  | "outreach_sent"
  | "tag_added"
  | "note_added";

type Row = {
  [key: string]: unknown;
};

type Table<T extends Row, Insert extends Row, Update extends Row> = {
  Row: T;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};

export type CompanyRow = {
  id: string;
  workspace_id: string;
  name: string;
  domain: string;
  description: string | null;
  category: CompanyCategory;
  industry: string | null;
  country: string | null;
  city: string | null;
  company_size: string | null;
  linkedin_url: string | null;
  source: CompanySource;
  source_url: string | null;
  status: LeadStatus;
  notes: string | null;
  recommended_service: string | null;
  total_score: number;
  last_activity_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ContactRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  name: string;
  role: string | null;
  email: string | null;
  linkedin_url: string | null;
  phone: string | null;
  confidence: number | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  url: string;
  technology_stack: Json;
  last_crawled_at: string | null;
  status: WebsiteStatus;
  created_at: string;
};

export type AuditRow = {
  id: string;
  workspace_id: string;
  website_id: string;
  company_id: string;
  status: AuditStatus;
  performance_score: number | null;
  seo_score: number | null;
  ux_score: number | null;
  accessibility_score: number | null;
  security_score: number | null;
  overall_score: number | null;
  raw_data: Json;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export type AuditFindingRow = {
  id: string;
  workspace_id: string;
  audit_id: string;
  category: string;
  severity: FindingSeverity;
  title: string;
  description: string | null;
  evidence: Json;
  recommendation: string | null;
  created_at: string;
};

export type LeadScoreRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  business_fit: number;
  website_opportunity: number;
  commercial_potential: number;
  contactability: number;
  growth_signals: number;
  data_confidence: number;
  total_score: number;
  reasoning: Json;
  created_at: string;
};

export type OpportunityRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  audit_id: string | null;
  category: string;
  title: string;
  description: string | null;
  evidence: Json;
  business_impact: string | null;
  recommended_service: string | null;
  priority: OpportunityPriority;
  status: OpportunityStatus;
  created_at: string;
};

export type OutreachSequenceRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  contact_id: string | null;
  status: OutreachStatus;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OutreachMessageRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  sequence_id: string | null;
  contact_id: string | null;
  channel: OutreachChannel;
  step: OutreachStep;
  subject: string | null;
  body: string;
  status: OutreachStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityRow = {
  id: string;
  workspace_id: string;
  company_id: string | null;
  type: ActivityType;
  description: string;
  metadata: Json;
  created_at: string;
};

export type TagRow = {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
};

export type CompanyTagRow = {
  company_id: string;
  tag_id: string;
  workspace_id: string;
  created_at: string;
};

export type JobRow = {
  id: string;
  workspace_id: string;
  type: JobType;
  status: JobStatus;
  payload: Json;
  result: Json;
  attempts: number;
  error: string | null;
  idempotency_key: string | null;
  created_at: string;
  completed_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      users: Table<UserRow, Partial<UserRow> & { id: string }, Partial<UserRow>>;
      workspaces: Table<
        WorkspaceRow,
        Partial<WorkspaceRow> & { name: string; slug: string; owner_id: string },
        Partial<WorkspaceRow>
      >;
      workspace_members: Table<
        WorkspaceMemberRow,
        Partial<WorkspaceMemberRow> & { workspace_id: string; user_id: string },
        Partial<WorkspaceMemberRow>
      >;
      companies: Table<
        CompanyRow,
        Partial<CompanyRow> & {
          workspace_id: string;
          name: string;
          domain: string;
        },
        Partial<CompanyRow>
      >;
      contacts: Table<
        ContactRow,
        Partial<ContactRow> & {
          workspace_id: string;
          company_id: string;
          name: string;
        },
        Partial<ContactRow>
      >;
      websites: Table<
        WebsiteRow,
        Partial<WebsiteRow> & {
          workspace_id: string;
          company_id: string;
          url: string;
        },
        Partial<WebsiteRow>
      >;
      audits: Table<
        AuditRow,
        Partial<AuditRow> & {
          workspace_id: string;
          website_id: string;
          company_id: string;
        },
        Partial<AuditRow>
      >;
      audit_findings: Table<
        AuditFindingRow,
        Partial<AuditFindingRow> & {
          workspace_id: string;
          audit_id: string;
          category: string;
          title: string;
        },
        Partial<AuditFindingRow>
      >;
      lead_scores: Table<
        LeadScoreRow,
        Partial<LeadScoreRow> & { workspace_id: string; company_id: string },
        Partial<LeadScoreRow>
      >;
      opportunities: Table<
        OpportunityRow,
        Partial<OpportunityRow> & {
          workspace_id: string;
          company_id: string;
          category: string;
          title: string;
        },
        Partial<OpportunityRow>
      >;
      outreach_sequences: Table<
        OutreachSequenceRow,
        Partial<OutreachSequenceRow> & {
          workspace_id: string;
          company_id: string;
        },
        Partial<OutreachSequenceRow>
      >;
      outreach_messages: Table<
        OutreachMessageRow,
        Partial<OutreachMessageRow> & {
          workspace_id: string;
          company_id: string;
          body: string;
        },
        Partial<OutreachMessageRow>
      >;
      activities: Table<
        ActivityRow,
        Partial<ActivityRow> & {
          workspace_id: string;
          type: ActivityType;
          description: string;
        },
        Partial<ActivityRow>
      >;
      tags: Table<
        TagRow,
        Partial<TagRow> & { workspace_id: string; name: string },
        Partial<TagRow>
      >;
      company_tags: Table<
        CompanyTagRow,
        Partial<CompanyTagRow> & {
          company_id: string;
          tag_id: string;
          workspace_id: string;
        },
        Partial<CompanyTagRow>
      >;
      jobs: Table<
        JobRow,
        Partial<JobRow> & { workspace_id: string; type: JobType },
        Partial<JobRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      company_category: CompanyCategory;
      lead_status: LeadStatus;
    };
  };
};
