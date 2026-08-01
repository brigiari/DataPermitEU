import type { Dataset, Recommendation } from "@/lib/types";
import { clamp01, containsAny, overlapTerms, tokenSet } from "@/lib/text";
import { DATA_CATEGORY_TERMS, DISEASE_AREA_TERMS } from "@/lib/recommendations/concepts";

export interface RelevanceComponent {
  ruleId: string;
  label: string;
  points: number;
  maxPoints: number;
  evidence: string[];
}

export interface RelevanceScore {
  datasetId: string;
  /** 0–100, rounded. Presented as a band, never as a precise claim. */
  score: number;
  band: "Strong signal" | "Possible fit" | "Weak signal";
  components: RelevanceComponent[];
  /** One-line summary shown next to catalogue results. */
  headline: string;
}

const WEIGHTS = {
  diseaseArea: 30,
  dataCategory: 25,
  variableOverlap: 25,
  summaryOverlap: 10,
  fitness: 10,
} as const;

/**
 * Scores one dataset against a free-text research question.
 *
 * The function is pure and fully deterministic: the same question always
 * yields the same score and the same explanation. Every point awarded is
 * attributable to a named component so the UI can show its working.
 */
export function scoreDatasetRelevance(dataset: Dataset, researchQuestion: string): RelevanceScore {
  const question = researchQuestion.trim();
  const tokens = tokenSet(question);
  const components: RelevanceComponent[] = [];

  /* REL-01 — disease-area concept match ---------------------------------- */
  const diseaseHits: string[] = [];
  for (const area of dataset.diseaseAreas) {
    const matched = containsAny(question, DISEASE_AREA_TERMS[area] ?? []);
    if (matched.length > 0) diseaseHits.push(`${area}: ${matched.slice(0, 3).join(", ")}`);
  }
  components.push({
    ruleId: "REL-01",
    label: "Disease-area match",
    points: diseaseHits.length > 0 ? WEIGHTS.diseaseArea : 0,
    maxPoints: WEIGHTS.diseaseArea,
    evidence:
      diseaseHits.length > 0
        ? diseaseHits
        : ["No disease-area term from the question appears in this dataset's coverage."],
  });

  /* REL-02 — data-category concept match --------------------------------- */
  const categoryHits: string[] = [];
  for (const category of dataset.dataCategories) {
    const matched = containsAny(question, DATA_CATEGORY_TERMS[category] ?? []);
    if (matched.length > 0) categoryHits.push(`${category}: ${matched.slice(0, 3).join(", ")}`);
  }
  components.push({
    ruleId: "REL-02",
    label: "Record-type match",
    points: categoryHits.length > 0 ? WEIGHTS.dataCategory : 0,
    maxPoints: WEIGHTS.dataCategory,
    evidence:
      categoryHits.length > 0
        ? categoryHits
        : ["No record-type term from the question matches this dataset's categories."],
  });

  /* REL-03 — variable-level keyword overlap ------------------------------ */
  const matchedVariables: string[] = [];
  for (const variable of dataset.variables) {
    const shared = overlapTerms(tokens, `${variable.name} ${variable.description}`);
    if (shared.length > 0) matchedVariables.push(`${variable.name} (${shared.slice(0, 3).join(", ")})`);
  }
  const variablePoints = Math.min(
    WEIGHTS.variableOverlap,
    Math.round((matchedVariables.length / 3) * WEIGHTS.variableOverlap),
  );
  components.push({
    ruleId: "REL-03",
    label: "Variable keyword overlap",
    points: variablePoints,
    maxPoints: WEIGHTS.variableOverlap,
    evidence:
      matchedVariables.length > 0
        ? matchedVariables.slice(0, 5)
        : ["No variable name or description shares a content word with the question."],
  });

  /* REL-03 (continued) — summary overlap --------------------------------- */
  const summaryShared = overlapTerms(tokens, `${dataset.summary} ${dataset.name}`);
  const summaryPoints = Math.min(
    WEIGHTS.summaryOverlap,
    summaryShared.length * Math.ceil(WEIGHTS.summaryOverlap / 3),
  );
  components.push({
    ruleId: "REL-03",
    label: "Description overlap",
    points: summaryPoints,
    maxPoints: WEIGHTS.summaryOverlap,
    evidence:
      summaryShared.length > 0
        ? [`Shared terms: ${summaryShared.slice(0, 6).join(", ")}`]
        : ["The dataset description shares no content word with the question."],
  });

  /* REL-04 — fitness adjustment ------------------------------------------ */
  const usability = (dataset.quality.completeness + dataset.quality.interoperability) / 200;
  const accessPenalty =
    dataset.accessComplexity === "Complex" ? 0.4 : dataset.accessComplexity === "Standard" ? 0.15 : 0;
  const fitnessPoints = Math.round(clamp01(usability - accessPenalty) * WEIGHTS.fitness);
  components.push({
    ruleId: "REL-04",
    label: "Usability and access burden",
    points: fitnessPoints,
    maxPoints: WEIGHTS.fitness,
    evidence: [
      `Completeness ${dataset.quality.completeness}/100, interoperability ${dataset.quality.interoperability}/100.`,
      `Access complexity: ${dataset.accessComplexity}.`,
    ],
  });

  const score = components.reduce((total, component) => total + component.points, 0);
  const band: RelevanceScore["band"] = score >= 60 ? "Strong signal" : score >= 30 ? "Possible fit" : "Weak signal";

  const reasons: string[] = [];
  if (diseaseHits.length > 0) reasons.push("covers a disease area named in the question");
  if (categoryHits.length > 0) reasons.push("holds the type of record the question describes");
  if (matchedVariables.length > 0) reasons.push(`has ${matchedVariables.length} variable(s) matching question terms`);
  const headline =
    reasons.length > 0
      ? `Surfaced because it ${reasons.join(", and ")}.`
      : "No keyword signal from the current research question. Shown for completeness.";

  return { datasetId: dataset.id, score, band, components, headline };
}

/** Ranks the full catalogue against a research question. Ties break by id for stability. */
export function rankDatasets(datasets: Dataset[], researchQuestion: string): RelevanceScore[] {
  return datasets
    .map((dataset) => scoreDatasetRelevance(dataset, researchQuestion))
    .sort((a, b) => b.score - a.score || a.datasetId.localeCompare(b.datasetId));
}

/** Converts strong relevance signals into reviewable recommendations. */
export function relevanceRecommendations(
  datasets: Dataset[],
  researchQuestion: string,
  alreadySelected: string[],
  limit = 3,
): Recommendation[] {
  if (researchQuestion.trim().length < 15) return [];
  return rankDatasets(datasets, researchQuestion)
    .filter((result) => result.score >= 45 && !alreadySelected.includes(result.datasetId))
    .slice(0, limit)
    .map((result) => {
      const dataset = datasets.find((candidate) => candidate.id === result.datasetId)!;
      return {
        id: `REL-01:${result.datasetId}`,
        kind: "dataset-relevance" as const,
        severity: "info" as const,
        title: `${dataset.acronym} may be relevant to this research question`,
        reason: result.headline,
        suggestedAction:
          "Open the dataset profile and check the variables, coverage and access conditions against your protocol before adding it.",
        evidence: result.components
          .filter((component) => component.points > 0)
          .map((component) => `${component.label}: ${component.evidence[0]}`),
        ruleId: "REL-01",
        scope: { datasetIds: [result.datasetId] },
        source: "deterministic-rules" as const,
        confidence: clamp01(result.score / 100),
      };
    });
}
