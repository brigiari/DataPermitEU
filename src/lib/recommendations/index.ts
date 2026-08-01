import type { Recommendation, RecommendationKind } from "@/lib/types";
import { compatibilityRecommendations } from "@/lib/recommendations/compatibility";
import { completenessRecommendations } from "@/lib/recommendations/completeness";
import { minimisationRecommendations } from "@/lib/recommendations/minimisation";
import { purposeRecommendations } from "@/lib/recommendations/purpose";
import { relevanceRecommendations } from "@/lib/recommendations/relevance";
import { terminologyRecommendations } from "@/lib/recommendations/terminology";
import {
  dedupeRecommendations,
  sortRecommendations,
  type RecommendationContext,
  type RecommendationProvider,
} from "@/lib/recommendations/provider";

/**
 * The shipped provider: a set of hand-written, fully inspectable rules.
 *
 * Deterministic by construction — the same project state always produces the
 * same findings in the same order.
 */
export const deterministicProvider: RecommendationProvider = {
  id: "deterministic-rules",
  label: "Deterministic rule set",
  description:
    "Hand-written rules over catalogue metadata and application text. No model, no network call, no training data. Every finding names the rule that produced it.",
  deterministic: true,
  analyse(context: RecommendationContext): Recommendation[] {
    const { project, datasets, application, catalogue } = context;
    return sortRecommendations(
      dedupeRecommendations([
        ...relevanceRecommendations(catalogue, project.researchQuestion, project.datasetIds),
        ...compatibilityRecommendations(datasets),
        ...terminologyRecommendations(datasets),
        ...minimisationRecommendations({ application, datasets }),
        ...completenessRecommendations(application, datasets),
        ...purposeRecommendations(application, datasets),
      ]),
    );
  },
};

/**
 * The active provider. Swapping this line is the whole integration surface for
 * a model-backed or terminology-service-backed implementation.
 */
export const activeProvider: RecommendationProvider = deterministicProvider;

/** Runs the active provider and removes anything the user has dismissed. */
export function analyseProject(context: RecommendationContext): Recommendation[] {
  const dismissed = new Set(context.project.dismissedRecommendations);
  return activeProvider.analyse(context).filter((finding) => !dismissed.has(finding.id));
}

/** All findings including dismissed ones, for the audit view. */
export function analyseProjectIncludingDismissed(context: RecommendationContext): Recommendation[] {
  return activeProvider.analyse(context);
}

export function groupByKind(findings: Recommendation[]): Record<RecommendationKind, Recommendation[]> {
  const groups: Record<RecommendationKind, Recommendation[]> = {
    "dataset-relevance": [],
    "cross-dataset-compatibility": [],
    "missing-information": [],
    "data-minimisation": [],
    "terminology-conflict": [],
    "purpose-concern": [],
  };
  for (const finding of findings) groups[finding.kind].push(finding);
  return groups;
}

export const KIND_LABELS: Record<RecommendationKind, string> = {
  "dataset-relevance": "Dataset relevance",
  "cross-dataset-compatibility": "Cross-dataset compatibility",
  "missing-information": "Missing information",
  "data-minimisation": "Data minimisation",
  "terminology-conflict": "Terminology conflict",
  "purpose-concern": "Research-purpose concern",
};

export * from "@/lib/recommendations/provider";
