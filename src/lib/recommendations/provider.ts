import type { ApplicationDraft, Dataset, Project, Recommendation } from "@/lib/types";

/**
 * The seam.
 *
 * Every recommendation in the product is produced through this interface. The
 * shipped implementation is a set of deterministic rules, but nothing in the
 * user interface knows that: it renders `Recommendation` objects and reads
 * `reason`, `evidence` and `ruleId` without caring how they were produced.
 *
 * To add a language model or a terminology service, implement this interface
 * and register it in `src/lib/recommendations/index.ts`. Two constraints hold
 * for any implementation, deterministic or not:
 *
 *  1. Every finding must carry a human-readable `reason` and its supporting
 *     `evidence`. A finding a user cannot interrogate must not be shown.
 *  2. No finding may be presented as a decision. The product surfaces prompts
 *     for a person to consider; it does not approve, reject, or advise on the
 *     lawfulness of anything.
 */
export interface RecommendationContext {
  project: Project;
  datasets: Dataset[];
  application: ApplicationDraft;
  /** The full catalogue, for relevance suggestions beyond the current project. */
  catalogue: Dataset[];
}

export interface RecommendationProvider {
  /** Stable identifier shown in the UI so users know what produced a finding. */
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Whether findings can vary between runs on identical input. */
  readonly deterministic: boolean;
  analyse(context: RecommendationContext): Recommendation[];
}

/**
 * Sorting is part of the contract: findings must appear in a stable order so
 * that a user who dismisses one does not see the rest reshuffle.
 */
export function sortRecommendations(findings: Recommendation[]): Recommendation[] {
  const severityRank = { attention: 0, advisory: 1, info: 2 } as const;
  return [...findings].sort(
    (a, b) =>
      severityRank[a.severity] - severityRank[b.severity] ||
      a.ruleId.localeCompare(b.ruleId) ||
      a.id.localeCompare(b.id),
  );
}

/** Removes duplicate ids, keeping the first occurrence. */
export function dedupeRecommendations(findings: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  const result: Recommendation[] = [];
  for (const finding of findings) {
    if (seen.has(finding.id)) continue;
    seen.add(finding.id);
    result.push(finding);
  }
  return result;
}

/** Qualitative band for a confidence value — the UI never shows a raw number as a promise. */
export function confidenceBand(confidence: number): "Low" | "Moderate" | "High" {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.55) return "Moderate";
  return "Low";
}
