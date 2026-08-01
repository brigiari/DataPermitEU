import type { ApplicationStatus } from "@/lib/types";
import { Badge } from "@/components/ui/primitives";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  "internal-review": "Internal review",
  submitted: "Submitted (mock)",
  "clarification-requested": "Clarification requested",
  approved: "Approved (mock)",
  withdrawn: "Withdrawn",
};

const STATUS_TONES = {
  draft: "neutral",
  "internal-review": "cyan",
  submitted: "gold",
  "clarification-requested": "caution",
  approved: "positive",
  withdrawn: "neutral",
} as const;

export const STATUS_DESCRIPTIONS: Record<ApplicationStatus, string> = {
  draft: "Being written. Nothing has been shared with anyone.",
  "internal-review": "With colleagues for comment before any external submission.",
  submitted: "Marked as submitted in this prototype. No application is ever actually transmitted.",
  "clarification-requested": "A reviewer has raised questions that need answering.",
  approved: "A simulated approval used to demonstrate the tracker. It carries no real authorisation.",
  withdrawn: "No longer being pursued.",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
