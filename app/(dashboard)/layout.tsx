import { DashboardActionsProvider } from "@/components/dashboard/dashboard-actions";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { requireWorkspace } from "@/lib/auth/workspace";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, workspace } = await requireWorkspace();
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("companies")
    .select("id, name, domain")
    .eq("workspace_id", workspace.id)
    .order("total_score", { ascending: false })
    .limit(12);

  return (
    <DashboardActionsProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav email={user.email} name={user.fullName} />
          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
      <CommandPalette leads={leads ?? []} />
    </DashboardActionsProvider>
  );
}
