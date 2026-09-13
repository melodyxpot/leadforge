import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "border-border bg-muted text-muted-foreground",
  researched: "border-border bg-muted text-foreground",
  qualified: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  contacted: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  replied: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  meeting: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  proposal: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  won: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  lost: "border-destructive/20 bg-destructive/10 text-destructive",
  nurture: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("uppercase", STATUS_STYLES[status])}>
      {LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}
