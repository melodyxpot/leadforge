import { createClient } from "@/lib/supabase/server";
import type { ActivityRow, ActivityType, Json } from "@/types/database";

type CreateActivityInput = {
  workspaceId: string;
  companyId?: string | null;
  type: ActivityType;
  description: string;
  metadata?: Json;
};

export async function createActivity(input: CreateActivityInput) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from("activities").insert({
    workspace_id: input.workspaceId,
    company_id: input.companyId ?? null,
    type: input.type,
    description: input.description,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw error;
  }

  if (input.companyId) {
    await supabase
      .from("companies")
      .update({ last_activity_at: now })
      .eq("id", input.companyId)
      .eq("workspace_id", input.workspaceId);
  }
}

export async function listRecentActivities(
  workspaceId: string,
  limit = 8,
): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listCompanyActivities(
  workspaceId: string,
  companyId: string,
  limit = 20,
): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
