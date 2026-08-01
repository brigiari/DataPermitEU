import type { ApplicationDraft, Dataset, Recommendation, RequestedVariable } from "@/lib/types";
import { containsAny, wordCount } from "@/lib/text";
import { CONCEPT_GROUPS, VARIABLE_CATEGORY_TERMS } from "@/lib/recommendations/concepts";

/** Share of a dataset's variables above which the request looks untargeted. */
const BROAD_REQUEST_THRESHOLD = 0.6;
/** Minimum words before a per-variable justification is treated as specific. */
const MIN_JUSTIFICATION_WORDS = 6;

export interface MinimisationContext {
  application: ApplicationDraft;
  datasets: Dataset[];
}

function purposeText(application: ApplicationDraft): string {
  return [
    application.researchPurpose,
    application.publicInterestJustification,
    application.analysisPlan,
    application.statisticalMethods,
    application.expectedOutputs,
  ]
    .join(" ")
    .trim();
}

function resolve(datasets: Dataset[], requested: RequestedVariable) {
  const dataset = datasets.find((candidate) => candidate.id === requested.datasetId);
  const variable = dataset?.variables.find((candidate) => candidate.id === requested.variableId);
  return { dataset, variable };
}

/**
 * The data-minimisation assistant.
 *
 * Every finding is advisory. The rules cannot know a study's confounding
 * structure, so a flagged variable is a prompt to write down a justification —
 * never an instruction to remove anything.
 */
export function minimisationRecommendations(context: MinimisationContext): Recommendation[] {
  const { application, datasets } = context;
  const findings: Recommendation[] = [];
  const narrative = purposeText(application);

  for (const requested of application.requestedVariables) {
    const { dataset, variable } = resolve(datasets, requested);
    if (!dataset || !variable) continue;
    const label = `${variable.name} (${dataset.acronym})`;

    /* MIN-01 — direct identifiers ---------------------------------------- */
    if (variable.sensitivity === "direct-identifier") {
      findings.push({
        id: `MIN-01:${dataset.id}:${variable.id}`,
        kind: "data-minimisation",
        severity: "attention",
        title: `${label} is classified as a direct identifier`,
        reason: `The catalogue classifies this variable as directly identifying. ${
          variable.defaultGranularity
            ? `The holder's default release is: ${variable.defaultGranularity}.`
            : "Holders rarely release variables in this class for secondary use."
        }`,
        suggestedAction: variable.defaultGranularity
          ? `Switch this variable to the holder's default form (${variable.defaultGranularity}) unless your analysis genuinely requires the identifying detail — and if it does, state exactly why.`
          : "Remove this variable unless the analysis is impossible without it, and if so, document the specific necessity and the safeguards applied.",
        evidence: [
          `Sensitivity classification: ${variable.sensitivity}`,
          `Variable category: ${variable.category}`,
          `Requested granularity: ${requested.granularity}`,
        ],
        ruleId: "MIN-01",
        scope: { datasetIds: [dataset.id], variableIds: [variable.id] },
        source: "deterministic-rules",
        confidence: 0.9,
      });
    }

    /* MIN-02 — coarser form available ------------------------------------ */
    if (
      variable.defaultGranularity &&
      requested.granularity === "as-published" &&
      variable.sensitivity !== "direct-identifier"
    ) {
      findings.push({
        id: `MIN-02:${dataset.id}:${variable.id}`,
        kind: "data-minimisation",
        severity: "advisory",
        title: `A coarser form of ${label} is available`,
        reason: `The holder publishes a reduced-detail default for this variable: ${variable.defaultGranularity}. You have requested it at full granularity.`,
        suggestedAction:
          "Check whether the coarser form still supports your analysis. If it does, requesting it strengthens the minimisation argument at no analytical cost.",
        evidence: [
          `Default release form: ${variable.defaultGranularity}`,
          `Requested granularity: ${requested.granularity}`,
        ],
        ruleId: "MIN-02",
        scope: { datasetIds: [dataset.id], variableIds: [variable.id] },
        source: "deterministic-rules",
        confidence: 0.7,
      });
    }

    /* MIN-03 — sensitive variable without a specific justification -------- */
    const justification = requested.justification.trim();
    const restatesName = justification.toLowerCase().replace(/[^a-z ]/g, "").trim() === variable.name.toLowerCase();
    if (
      (variable.sensitivity === "high" || variable.sensitivity === "direct-identifier") &&
      (wordCount(justification) < MIN_JUSTIFICATION_WORDS || restatesName)
    ) {
      findings.push({
        id: `MIN-03:${dataset.id}:${variable.id}`,
        kind: "data-minimisation",
        severity: "attention",
        title: `${label} has no specific justification`,
        reason: `This variable is classified as ${variable.sensitivity} sensitivity, but the justification recorded against it is ${
          justification.length === 0 ? "empty" : `only ${wordCount(justification)} word(s)`
        }. A reviewer cannot assess necessity from that.`,
        suggestedAction:
          "Write one or two sentences saying which analysis step needs this variable and what would be lost without it.",
        evidence: [
          `Sensitivity: ${variable.sensitivity}`,
          justification.length === 0
            ? "No justification recorded."
            : `Recorded justification: "${justification}"`,
        ],
        ruleId: "MIN-03",
        scope: { datasetIds: [dataset.id], variableIds: [variable.id] },
        source: "deterministic-rules",
        confidence: 0.85,
      });
    }

    /* MIN-04 — category unconnected to the stated purpose ------------------ */
    const categoryTerms = VARIABLE_CATEGORY_TERMS[variable.category] ?? [];
    const supported = containsAny(narrative, categoryTerms);
    const justified = wordCount(justification) >= MIN_JUSTIFICATION_WORDS;
    if (
      categoryTerms.length > 0 &&
      supported.length === 0 &&
      !justified &&
      variable.category !== "identifier" &&
      narrative.length > 40
    ) {
      findings.push({
        id: `MIN-04:${dataset.id}:${variable.id}`,
        kind: "data-minimisation",
        severity: "advisory",
        title: `Nothing in the stated purpose explains why ${label} is needed`,
        reason: `This is a ${variable.category} variable, but neither the research purpose nor the analysis plan uses any term associated with ${variable.category} analysis, and no per-variable justification was recorded.`,
        suggestedAction:
          "Either describe the role this variable plays — confounding adjustment counts, and is a common reason a variable looks unrelated — or remove it from the request.",
        evidence: [
          `Variable category: ${variable.category}`,
          `Terms the rule looked for: ${categoryTerms.slice(0, 6).join(", ")}`,
          "None of those terms appear in the purpose, analysis plan or expected outputs.",
        ],
        ruleId: "MIN-04",
        scope: { datasetIds: [dataset.id], variableIds: [variable.id] },
        source: "deterministic-rules",
        confidence: 0.45,
      });
    }

    /* MIN-06 — free text --------------------------------------------------- */
    if (/free[- ]text|unstructured|comments|notes/i.test(`${variable.name} ${variable.description}`)) {
      findings.push({
        id: `MIN-06:${dataset.id}:${variable.id}`,
        kind: "data-minimisation",
        severity: "attention",
        title: `${label} contains unstructured text`,
        reason:
          "Free-text fields frequently contain incidental identifying detail that no automated process removes reliably, so they carry a materially higher residual re-identification risk than coded fields.",
        suggestedAction:
          "Use the structured or coded equivalent if one exists. If free text is genuinely required, describe the de-identification approach and who will validate it.",
        evidence: [
          `Variable description: ${variable.description}`,
          variable.defaultGranularity ? `Holder default: ${variable.defaultGranularity}` : "No coarsened default declared.",
        ],
        ruleId: "MIN-06",
        scope: { datasetIds: [dataset.id], variableIds: [variable.id] },
        source: "deterministic-rules",
        confidence: 0.85,
      });
    }
  }

  /* MIN-05 — broad share of a dataset requested --------------------------- */
  for (const dataset of datasets) {
    const requestedHere = application.requestedVariables.filter(
      (requested) => requested.datasetId === dataset.id,
    );
    if (requestedHere.length === 0) continue;
    const share = requestedHere.length / dataset.variables.length;
    if (share >= BROAD_REQUEST_THRESHOLD && dataset.variables.length >= 8) {
      findings.push({
        id: `MIN-05:${dataset.id}`,
        kind: "data-minimisation",
        severity: "advisory",
        title: `${Math.round(share * 100)}% of ${dataset.acronym} has been requested`,
        reason: `${requestedHere.length} of ${dataset.variables.length} variables are included. Requesting most of a dataset usually indicates the selection was made from the catalogue rather than derived from the analysis plan.`,
        suggestedAction:
          "Work back from the analysis plan: list the variables each planned model or table actually consumes, and drop the rest.",
        evidence: [
          `Requested: ${requestedHere.length} of ${dataset.variables.length} variables`,
          `Threshold used by this rule: ${Math.round(BROAD_REQUEST_THRESHOLD * 100)}%`,
        ],
        ruleId: "MIN-05",
        scope: { datasetIds: [dataset.id] },
        source: "deterministic-rules",
        confidence: 0.6,
      });
    }
  }

  /* MIN-07 — the same concept requested from several datasets ------------- */
  for (const group of CONCEPT_GROUPS) {
    const matches = application.requestedVariables.filter((requested) => {
      const { variable } = resolve(datasets, requested);
      if (!variable) return false;
      const haystack = variable.name.toLowerCase();
      return group.terms.some((term) => haystack.includes(term));
    });
    const distinctDatasets = Array.from(new Set(matches.map((match) => match.datasetId)));
    if (distinctDatasets.length > 1) {
      const labels = matches.map((match) => {
        const { dataset, variable } = resolve(datasets, match);
        return `${variable?.name} (${dataset?.acronym})`;
      });
      findings.push({
        id: `MIN-07:${group.concept.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        kind: "data-minimisation",
        severity: "advisory",
        title: `"${group.concept}" is requested from ${distinctDatasets.length} datasets`,
        reason: `The same analytical concept appears in several sources: ${labels.join("; ")}. Unless the duplication serves validation or linkage, one source is usually enough.`,
        suggestedAction:
          "Either state why more than one source of this measure is needed — cross-validation and linkage-key construction are both legitimate reasons — or request it from a single dataset.",
        evidence: labels,
        ruleId: "MIN-07",
        scope: {
          datasetIds: distinctDatasets,
          variableIds: matches.map((match) => match.variableId),
        },
        source: "deterministic-rules",
        confidence: 0.5,
      });
    }
  }

  return findings;
}

/** Summary counters used by the minimisation review page. */
export function minimisationSummary(context: MinimisationContext) {
  const { application, datasets } = context;
  const requested = application.requestedVariables;
  const resolved = requested
    .map((request) => resolve(datasets, request).variable)
    .filter((variable): variable is NonNullable<typeof variable> => Boolean(variable));

  return {
    totalRequested: requested.length,
    totalAvailable: datasets.reduce((total, dataset) => total + dataset.variables.length, 0),
    bySensitivity: {
      low: resolved.filter((variable) => variable.sensitivity === "low").length,
      moderate: resolved.filter((variable) => variable.sensitivity === "moderate").length,
      high: resolved.filter((variable) => variable.sensitivity === "high").length,
      "direct-identifier": resolved.filter((variable) => variable.sensitivity === "direct-identifier").length,
    },
    withJustification: requested.filter(
      (request) => wordCount(request.justification) >= MIN_JUSTIFICATION_WORDS,
    ).length,
    coarsened: requested.filter((request) => request.granularity !== "as-published").length,
  };
}
