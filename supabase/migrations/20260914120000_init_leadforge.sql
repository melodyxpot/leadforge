-- LeadForge initial schema
-- Workspace-scoped B2B prospecting data with RLS.

create schema if not exists extensions;
create extension if not exists pg_trgm schema extensions;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create type public.workspace_role as enum ('owner', 'member');
create type public.company_category as enum (
  'igaming',
  'affiliate',
  'marketing',
  'seo',
  'media',
  'software',
  'payments',
  'other'
);
create type public.company_source as enum ('manual', 'csv', 'url_paste', 'discovery');
create type public.lead_status as enum (
  'new',
  'researched',
  'qualified',
  'contacted',
  'replied',
  'meeting',
  'proposal',
  'won',
  'lost',
  'nurture'
);
create type public.website_status as enum ('unknown', 'pending', 'crawled', 'failed');
create type public.audit_status as enum ('queued', 'running', 'completed', 'failed');
create type public.finding_severity as enum ('low', 'medium', 'high', 'critical');
create type public.opportunity_priority as enum ('low', 'medium', 'high');
create type public.opportunity_status as enum ('open', 'in_progress', 'won', 'dismissed');
create type public.outreach_channel as enum ('email', 'linkedin', 'other');
create type public.outreach_status as enum (
  'draft',
  'to_contact',
  'sent',
  'replied',
  'meeting',
  'proposal',
  'won',
  'lost',
  'nurture'
);
create type public.outreach_step as enum ('initial', 'follow_up_1', 'follow_up_2', 'final');
create type public.job_type as enum (
  'audit_website',
  'analyze_audit',
  'generate_opportunities',
  'calculate_lead_score',
  'generate_outreach'
);
create type public.job_status as enum ('queued', 'running', 'completed', 'failed', 'cancelled');
create type public.activity_type as enum (
  'company_created',
  'company_updated',
  'status_changed',
  'contact_added',
  'audit_completed',
  'score_updated',
  'outreach_generated',
  'outreach_sent',
  'tag_added',
  'note_added'
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  domain text not null,
  description text,
  category public.company_category not null default 'other',
  industry text,
  country text,
  city text,
  company_size text,
  linkedin_url text,
  source public.company_source not null default 'manual',
  source_url text,
  status public.lead_status not null default 'new',
  notes text,
  recommended_service text,
  total_score integer not null default 0,
  last_activity_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, domain)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  role text,
  email text,
  linkedin_url text,
  phone text,
  confidence numeric(4, 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.websites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  url text not null,
  technology_stack jsonb not null default '[]'::jsonb,
  last_crawled_at timestamptz,
  status public.website_status not null default 'unknown',
  created_at timestamptz not null default now()
);

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  website_id uuid not null references public.websites (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  status public.audit_status not null default 'queued',
  performance_score integer,
  seo_score integer,
  ux_score integer,
  accessibility_score integer,
  security_score integer,
  overall_score integer,
  raw_data jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  audit_id uuid not null references public.audits (id) on delete cascade,
  category text not null,
  severity public.finding_severity not null default 'medium',
  title text not null,
  description text,
  evidence jsonb not null default '{}'::jsonb,
  recommendation text,
  created_at timestamptz not null default now()
);

create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  business_fit integer not null default 0,
  website_opportunity integer not null default 0,
  commercial_potential integer not null default 0,
  contactability integer not null default 0,
  growth_signals integer not null default 0,
  data_confidence integer not null default 0,
  total_score integer not null default 0,
  reasoning jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  audit_id uuid references public.audits (id) on delete set null,
  category text not null,
  title text not null,
  description text,
  evidence jsonb not null default '{}'::jsonb,
  business_impact text,
  recommended_service text,
  priority public.opportunity_priority not null default 'medium',
  status public.opportunity_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.outreach_sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  status public.outreach_status not null default 'to_contact',
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  sequence_id uuid references public.outreach_sequences (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  channel public.outreach_channel not null default 'email',
  step public.outreach_step not null default 'initial',
  subject text,
  body text not null,
  status public.outreach_status not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  type public.activity_type not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.company_tags (
  company_id uuid not null references public.companies (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (company_id, tag_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type public.job_type not null,
  status public.job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  attempts integer not null default 0,
  error text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create index companies_workspace_id_idx on public.companies (workspace_id);
create index companies_domain_idx on public.companies (domain);
create index companies_name_idx on public.companies (name);
create index companies_total_score_idx on public.companies (total_score desc);
create index companies_status_idx on public.companies (status);
create index companies_category_idx on public.companies (category);
create index companies_created_at_idx on public.companies (created_at desc);
create index companies_workspace_score_idx on public.companies (workspace_id, total_score desc);
create index companies_name_trgm_idx on public.companies using gin (name gin_trgm_ops);
create index companies_domain_trgm_idx on public.companies using gin (domain gin_trgm_ops);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index contacts_workspace_id_idx on public.contacts (workspace_id);
create index contacts_company_id_idx on public.contacts (company_id);
create index contacts_email_idx on public.contacts (email);
create index websites_workspace_id_idx on public.websites (workspace_id);
create index websites_company_id_idx on public.websites (company_id);
create index audits_workspace_id_idx on public.audits (workspace_id);
create index audits_company_id_idx on public.audits (company_id);
create index audits_status_idx on public.audits (status);
create index audit_findings_audit_id_idx on public.audit_findings (audit_id);
create index lead_scores_company_id_idx on public.lead_scores (company_id, created_at desc);
create index opportunities_company_id_idx on public.opportunities (company_id);
create index outreach_messages_company_id_idx on public.outreach_messages (company_id);
create index outreach_sequences_follow_up_idx on public.outreach_sequences (workspace_id, next_follow_up_at);
create index activities_workspace_created_idx on public.activities (workspace_id, created_at desc);
create index activities_company_id_idx on public.activities (company_id, created_at desc);
create index tags_workspace_id_idx on public.tags (workspace_id);
create index company_tags_tag_id_idx on public.company_tags (tag_id);
create index jobs_workspace_status_idx on public.jobs (workspace_id, status);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function private.set_updated_at();

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function private.set_updated_at();

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function private.set_updated_at();

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function private.set_updated_at();

create trigger outreach_sequences_set_updated_at
  before update on public.outreach_sequences
  for each row execute function private.set_updated_at();

create trigger outreach_messages_set_updated_at
  before update on public.outreach_messages
  for each row execute function private.set_updated_at();

create or replace function private.user_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.workspace_members
  where user_id = (select auth.uid());
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1),
    'User'
  );

  insert into public.users (id, email, full_name)
  values (new.id, new.email, display_name);

  insert into public.workspaces (name, slug, owner_id)
  values (
    display_name || '''s Workspace',
    'ws-' || substr(replace(new.id::text, '-', ''), 1, 16),
    new.id
  )
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

grant usage on schema private to authenticated;
grant execute on function private.user_workspace_ids() to authenticated;

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.websites enable row level security;
alter table public.audits enable row level security;
alter table public.audit_findings enable row level security;
alter table public.lead_scores enable row level security;
alter table public.opportunities enable row level security;
alter table public.outreach_sequences enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.activities enable row level security;
alter table public.tags enable row level security;
alter table public.company_tags enable row level security;
alter table public.jobs enable row level security;

create policy "users_select_self_or_workspace"
on public.users for select to authenticated
using (
  id = (select auth.uid())
  or id in (
    select m2.user_id
    from public.workspace_members m1
    join public.workspace_members m2 on m1.workspace_id = m2.workspace_id
    where m1.user_id = (select auth.uid())
  )
);

create policy "users_update_self"
on public.users for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "workspaces_select_member"
on public.workspaces for select to authenticated
using (id in (select private.user_workspace_ids()));

create policy "workspaces_update_owner"
on public.workspaces for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "workspace_members_select"
on public.workspace_members for select to authenticated
using (workspace_id in (select private.user_workspace_ids()));

create policy "companies_all_member"
on public.companies for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "contacts_all_member"
on public.contacts for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "websites_all_member"
on public.websites for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "audits_all_member"
on public.audits for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "audit_findings_all_member"
on public.audit_findings for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "lead_scores_all_member"
on public.lead_scores for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "opportunities_all_member"
on public.opportunities for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "outreach_sequences_all_member"
on public.outreach_sequences for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "outreach_messages_all_member"
on public.outreach_messages for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "activities_all_member"
on public.activities for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "tags_all_member"
on public.tags for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "company_tags_all_member"
on public.company_tags for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

create policy "jobs_all_member"
on public.jobs for all to authenticated
using (workspace_id in (select private.user_workspace_ids()))
with check (workspace_id in (select private.user_workspace_ids()));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
