-- Follow-up hardening from Supabase advisors.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

alter function private.set_updated_at() set search_path = public;

create index if not exists audit_findings_workspace_id_idx on public.audit_findings (workspace_id);
create index if not exists audits_website_id_idx on public.audits (website_id);
create index if not exists company_tags_workspace_id_idx on public.company_tags (workspace_id);
create index if not exists lead_scores_workspace_id_idx on public.lead_scores (workspace_id);
create index if not exists opportunities_audit_id_idx on public.opportunities (audit_id);
create index if not exists opportunities_workspace_id_idx on public.opportunities (workspace_id);
create index if not exists outreach_messages_contact_id_idx on public.outreach_messages (contact_id);
create index if not exists outreach_messages_sequence_id_idx on public.outreach_messages (sequence_id);
create index if not exists outreach_messages_workspace_id_idx on public.outreach_messages (workspace_id);
create index if not exists outreach_sequences_company_id_idx on public.outreach_sequences (company_id);
create index if not exists outreach_sequences_contact_id_idx on public.outreach_sequences (contact_id);
create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);
