import { requireWorkspace } from "@/lib/auth/workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, workspace, role } = await requireWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Workspace ownership and shortcuts for daily prospecting."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Name</span>
              <span>{workspace.name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Role</span>
              <span className="capitalize">{role}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Signed in as</span>
              <span>{user.email}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Keyboard shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Shortcut keys="⌘ K" label="Command palette" />
            <Shortcut keys="N" label="New lead" />
            <Shortcut keys="/" label="Search" />
            <Shortcut keys="Esc" label="Close dialogs" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <Kbd>{keys}</Kbd>
    </div>
  );
}
