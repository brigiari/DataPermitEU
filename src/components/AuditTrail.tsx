import type { AuditEntry } from "@/lib/types";
import { Badge } from "@/components/ui/primitives";

const ACTOR_TONE = {
  researcher: "cyan",
  reviewer: "gold",
  system: "neutral",
} as const;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The audit trail.
 *
 * Append-only and rendered newest-first. It records what the *system* did as
 * well as what the researcher did, because a recommendation that was generated
 * and then dismissed is part of the story of how an application was reached.
 */
export function AuditTrail({ entries, limit }: { entries: AuditEntry[]; limit?: number }) {
  const ordered = [...entries].reverse();
  const visible = limit ? ordered.slice(0, limit) : ordered;

  if (visible.length === 0) {
    return <p className="surface-muted p-4 text-sm text-ink-600">No activity recorded yet.</p>;
  }

  return (
    <ol className="surface divide-y divide-ink-100">
      {visible.map((entry) => (
        <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3.5">
          <time dateTime={entry.timestamp} className="w-40 shrink-0 font-mono text-xs text-ink-500">
            {formatTimestamp(entry.timestamp)}
          </time>
          <Badge tone={ACTOR_TONE[entry.actor]}>{entry.actor}</Badge>
          <span className="text-sm font-medium text-ink-900">{entry.action}</span>
          <span className="w-full text-sm text-ink-600 sm:w-auto sm:flex-1">{entry.detail}</span>
        </li>
      ))}
      {limit && ordered.length > limit ? (
        <li className="p-3 text-xs text-ink-500">
          Showing the {limit} most recent of {ordered.length} entries.
        </li>
      ) : null}
    </ol>
  );
}
