import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRow, WorkspaceRole } from "@/types/database";

export type AuthUser = {
  id: string;
  email: string | null;
  fullName: string | null;
};

export type CurrentWorkspace = {
  user: AuthUser;
  workspace: WorkspaceRow;
  role: WorkspaceRole;
};

export async function getCurrentWorkspace(): Promise<CurrentWorkspace | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    return null;
  }

  const userId = claims.sub;
  const email =
    typeof claims.email === "string" ? claims.email : null;

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const [{ data: workspace }, { data: profile }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("*")
      .eq("id", membership.workspace_id)
      .single(),
    supabase.from("users").select("full_name, email").eq("id", userId).maybeSingle(),
  ]);

  if (!workspace) {
    return null;
  }

  return {
    user: {
      id: userId,
      email: profile?.email ?? email,
      fullName: profile?.full_name ?? email,
    },
    workspace,
    role: membership.role,
  };
}

export async function requireWorkspace(): Promise<CurrentWorkspace> {
  const current = await getCurrentWorkspace();
  if (!current) {
    redirect("/login");
  }
  return current;
}
