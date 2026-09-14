import { SCORE_BAND_LABELS } from "@/lib/constants";
import { scoreBand } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BAND_STYLES = {
  priority: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  high: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  low: "border-border bg-muted text-muted-foreground",
};

export function ScoreBadge({ score }: { score: number }) {
  const band = scoreBand(score);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm tabular-nums text-foreground">{score}</span>
      <Badge variant="outline" className={cn("uppercase", BAND_STYLES[band])}>
        {SCORE_BAND_LABELS[band]}
      </Badge>
    </div>
  );
}
