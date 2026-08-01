import type { Dataset, Project, Recommendation } from "@/lib/types";
import { DOCUMENT_LABELS } from "@/lib/data/documents";
import { wordCount } from "@/lib/text";

export interface ReadinessDimension {
  id: "purpose" | "scope" | "method" | "governance" | "outputs" | "compatibility";
  label: string;
  description: string;
  /** 0–100. A completeness measure, explicitly not a likelihood of approval. */
  score: number;
  openItems: number;
  blocking: number;
}

export interface ReadinessReport {
  dimensions: ReadinessDimension[];
  /** Unweighted mean of the dimension scores. */
  overall: number;
  /** Findings that would most likely cause a submission to be returned. */
  blockingFindings: Recommendation[];
  documentsAttached: number;
  documentsRequired: number;
  missingDocuments: string[];
  band: "Not started" | "Early draft" | "Taking shape" | "Substantially complete";
}

const SECTION_FOR_KIND: Record<string, ReadinessDimension["id"]> = {
  "dataset-relevance": "compatibility",
  "cross-dataset-compatibility": "compatibility",
  "terminology-conflict": "compatibility",
  "data-minimisation": "scope",
  "purpose-concern": "purpose",
};

/** Where a finding belongs on the readiness dashboard. */
export function dimensionFor(finding: Recommendation): ReadinessDimension["id"] {
  if (finding.kind === "missing-information" && finding.scope.section) {
    const section = finding.scope.section as ReadinessDimension["id"];
    if (["purpose", "scope", "method", "governance", "outputs"].includes(section)) return section;
  }
  return SECTION_FOR_KIND[finding.kind] ?? "governance";
}

const DIMENSION_META: Record<
  ReadinessDimension["id"],
  { label: string; description: string }
> = {
  purpose: {
    label: "Purpose and public interest",
    description: "Why the study is being done and who benefits.",
  },
  scope: {
    label: "Scope and minimisation",
    description: "Which records and variables are requested, and why each is necessary.",
  },
  method: {
    label: "Analysis and linkage",
    description: "How the data will be analysed and whether records need to be joined.",
  },
  governance: {
    label: "Documentation and governance",
    description: "Ethics, legal basis, institutional authorisation and attestations.",
  },
  outputs: {
    label: "Duration, outputs and retention",
    description: "How long access is needed, what leaves the environment, and what happens afterwards.",
  },
  compatibility: {
    label: "Dataset fit and compatibility",
    description: "Whether the selected datasets can actually be combined as planned.",
  },
};

/** Fields that contribute a baseline completion score per dimension. */
function baselineScores(project: Project): Record<ReadinessDimension["id"], number> {
  const application = project.application;
  const filled = (value: string, target: number) =>
    Math.min(100, Math.round((wordCount(value) / target) * 100));

  const attestationCount = Object.values(application.attestations).filter(Boolean).length;
  const documentProgress = application.documents.filter(
    (document) => document.status === "attached",
  ).length;

  return {
    purpose: Math.round(
      (filled(application.researchPurpose, 40) +
        filled(application.publicInterestJustification, 30) +
        (application.purposeCategory === "" ? 0 : 100)) /
        3,
    ),
    scope: Math.round(
      (filled(application.populationDescription, 25) +
        (application.requestedVariables.length > 0 ? 100 : 0) +
        (application.timePeriod.start && application.timePeriod.end ? 100 : 0) +
        (application.estimatedCohortSize ? 100 : 0)) /
        4,
    ),
    method: Math.round(
      (filled(application.analysisPlan, 60) + filled(application.statisticalMethods, 25)) / 2,
    ),
    governance: Math.round(
      (filled(application.legalBasisNote, 25) +
        filled(application.ethicsNote, 25) +
        (attestationCount / 4) * 100 +
        Math.min(100, documentProgress * 20)) /
        4,
    ),
    outputs: Math.round(
      ((application.requestedAccessMonths === "" ? 0 : 100) +
        filled(application.expectedOutputs, 30) +
        filled(application.outputDisclosureControls, 20) +
        filled(application.dataDestructionPlan, 20)) /
        4,
    ),
    compatibility: project.datasetIds.length > 0 ? 100 : 0,
  };
}

/**
 * Builds the readiness report.
 *
 * The score measures how completely the application has been filled in and how
 * many open findings remain. It is not, and is labelled throughout as not, a
 * prediction of whether any access body would approve the request.
 */
export function buildReadinessReport(
  project: Project,
  datasets: Dataset[],
  findings: Recommendation[],
): ReadinessReport {
  const baseline = baselineScores(project);
  const dimensions: ReadinessDimension[] = (
    Object.keys(DIMENSION_META) as ReadinessDimension["id"][]
  ).map((id) => {
    const relevant = findings.filter((finding) => dimensionFor(finding) === id);
    const blocking = relevant.filter((finding) => finding.severity === "attention").length;
    const advisory = relevant.filter((finding) => finding.severity === "advisory").length;
    const penalty = Math.min(60, blocking * 15 + advisory * 5);
    return {
      id,
      label: DIMENSION_META[id].label,
      description: DIMENSION_META[id].description,
      score: Math.max(0, Math.min(100, baseline[id] - penalty)),
      openItems: relevant.length,
      blocking,
    };
  });

  const requiredDocumentIds = new Set(
    datasets.flatMap((dataset) => dataset.accessConditions.requiredDocuments),
  );
  const attached = project.application.documents.filter(
    (document) => requiredDocumentIds.has(document.id) && document.status === "attached",
  );
  const missing = Array.from(requiredDocumentIds)
    .filter(
      (id) =>
        !project.application.documents.some(
          (document) => document.id === id && document.status === "attached",
        ),
    )
    .map((id) => DOCUMENT_LABELS[id])
    .sort();

  const overall = Math.round(
    dimensions.reduce((total, dimension) => total + dimension.score, 0) / dimensions.length,
  );

  return {
    dimensions,
    overall,
    blockingFindings: findings.filter((finding) => finding.severity === "attention"),
    documentsAttached: attached.length,
    documentsRequired: requiredDocumentIds.size,
    missingDocuments: missing,
    band:
      overall >= 80
        ? "Substantially complete"
        : overall >= 50
          ? "Taking shape"
          : overall >= 20
            ? "Early draft"
            : "Not started",
  };
}
