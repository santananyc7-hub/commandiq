import { FlaskConical } from "lucide-react";

/** Clearly marks demo data so it is never mistaken for live figures (§24). */
export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-watch/30 bg-watch/10 px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-watch">
      <FlaskConical className="h-3.5 w-3.5" />
      Demo data
    </span>
  );
}
