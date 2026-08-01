import type { Dataset, Project, Recommendation } from "@/lib/types";
import { DOCUMENT_LABELS } from "@/lib/data/documents";
import { governingConstraints, intersectCoverage } from "@/lib/recommendations/compatibility";
import { buildReadinessReport } from "@/lib/readiness";

export const EXPORT_DISCLAIMER =
  "This document was produced by DataPermit EU, an independent fictional portfolio prototype. It is not an official European Commission, European Health Data Space, HealthData@EU or national Health Data Access Body form, and it has no standing in any real data-access process. All datasets, institutions, requirements and references it contains are invented. Every statement in it must be confirmed with the relevant legal, ethical and data-access authorities before use.";

export interface ApplicationExport {
  format: "datapermit-eu.mock-application";
  formatVersion: 1;
  disclaimer: string;
  generatedAt: string;
  project: {
    id: string;
    title: string;
    researchQuestion: string;
    principalInvestigator: string;
    institution: string;
    status: Project["status"];
    mockReference?: string;
    createdAt: string;
    updatedAt: string;
  };
  datasets: {
    id: string;
    acronym: string;
    name: string;
    holder: string;
    country: string;
    accessBody: string;
    catalogueRef: string;
    requiredDocuments: string[];
    requestedVariableCount: number;
  }[];
  combinedConstraints: {
    countries: string[];
    accessBodies: string[];
    minimumAggregationThreshold: number | null;
    maximumAccessMonths: number | null;
    sharedCoverage: { start: number; end: number } | null;
    secureProcessingEnvironmentRequired: boolean;
  };
  application: Project["application"];
  requestedVariablesDetailed: {
    dataset: string;
    variable: string;
    category: string;
    sensitivity: string;
    granularity: string;
    justification: string;
  }[];
  documents: { id: string; label: string; status: string; reference: string; note: string }[];
  readiness: {
    overall: number;
    band: string;
    dimensions: { id: string; label: string; score: number; openItems: number; blocking: number }[];
    documentsAttached: number;
    documentsRequired: number;
    missingDocuments: string[];
  };
  openFindings: {
    id: string;
    ruleId: string;
    kind: string;
    severity: string;
    title: string;
    reason: string;
    suggestedAction: string;
    evidence: string[];
  }[];
  dismissedFindings: string[];
  auditTrail: Project["auditTrail"];
  reviewerNotes: Project["reviewerNotes"];
}

/**
 * Builds the structured export.
 *
 * The export is the product's contract with the outside world, so it carries
 * the disclaimer, the full audit trail and every open finding — including the
 * ones the researcher chose to dismiss. An export that hid its own caveats
 * would defeat the point of the tool.
 */
export function buildApplicationExport(
  project: Project,
  datasets: Dataset[],
  findings: Recommendation[],
  generatedAt: string,
): ApplicationExport {
  const constraints = datasets.length > 0 ? governingConstraints(datasets) : null;
  const coverage = datasets.length > 0 ? intersectCoverage(datasets) : null;
  const readiness = buildReadinessReport(project, datasets, findings);

  return {
    format: "datapermit-eu.mock-application",
    formatVersion: 1,
    disclaimer: EXPORT_DISCLAIMER,
    generatedAt,
    project: {
      id: project.id,
      title: project.title,
      researchQuestion: project.researchQuestion,
      principalInvestigator: project.principalInvestigator,
      institution: project.institution,
      status: project.status,
      mockReference: project.mockReference,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    datasets: datasets.map((dataset) => ({
      id: dataset.id,
      acronym: dataset.acronym,
      name: dataset.name,
      holder: dataset.holder,
      country: dataset.country,
      accessBody: dataset.accessBody.name,
      catalogueRef: dataset.catalogueRef,
      requiredDocuments: dataset.accessConditions.requiredDocuments.map((id) => DOCUMENT_LABELS[id]),
      requestedVariableCount: project.application.requestedVariables.filter(
        (variable) => variable.datasetId === dataset.id,
      ).length,
    })),
    combinedConstraints: {
      countries: constraints?.countries ?? [],
      accessBodies: constraints?.jurisdictions ?? [],
      minimumAggregationThreshold: constraints?.aggregationThreshold ?? null,
      maximumAccessMonths: constraints?.maximumAccessMonths ?? null,
      sharedCoverage: coverage?.valid ? { start: coverage.start, end: coverage.end } : null,
      secureProcessingEnvironmentRequired: constraints?.secureEnvironmentRequired ?? false,
    },
    application: project.application,
    requestedVariablesDetailed: project.application.requestedVariables.map((requested) => {
      const dataset = datasets.find((candidate) => candidate.id === requested.datasetId);
      const variable = dataset?.variables.find((candidate) => candidate.id === requested.variableId);
      return {
        dataset: dataset?.acronym ?? requested.datasetId,
        variable: variable?.name ?? requested.variableId,
        category: variable?.category ?? "unknown",
        sensitivity: variable?.sensitivity ?? "unknown",
        granularity: requested.granularity,
        justification: requested.justification,
      };
    }),
    documents: project.application.documents.map((document) => ({
      id: document.id,
      label: DOCUMENT_LABELS[document.id],
      status: document.status,
      reference: document.reference,
      note: document.note,
    })),
    readiness: {
      overall: readiness.overall,
      band: readiness.band,
      dimensions: readiness.dimensions.map((dimension) => ({
        id: dimension.id,
        label: dimension.label,
        score: dimension.score,
        openItems: dimension.openItems,
        blocking: dimension.blocking,
      })),
      documentsAttached: readiness.documentsAttached,
      documentsRequired: readiness.documentsRequired,
      missingDocuments: readiness.missingDocuments,
    },
    openFindings: findings.map((finding) => ({
      id: finding.id,
      ruleId: finding.ruleId,
      kind: finding.kind,
      severity: finding.severity,
      title: finding.title,
      reason: finding.reason,
      suggestedAction: finding.suggestedAction,
      evidence: finding.evidence,
    })),
    dismissedFindings: project.dismissedRecommendations,
    auditTrail: project.auditTrail,
    reviewerNotes: project.reviewerNotes,
  };
}

export function toJsonBlob(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

/** Triggers a client-side download without any server round-trip. */
export function downloadJson(filename: string, payload: unknown): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([toJsonBlob(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Builds the audit-trail-only export. */
export function buildAuditExport(project: Project, generatedAt: string) {
  return {
    format: "datapermit-eu.audit-trail" as const,
    formatVersion: 1 as const,
    disclaimer: EXPORT_DISCLAIMER,
    generatedAt,
    projectId: project.id,
    projectTitle: project.title,
    entries: project.auditTrail,
    reviewerNotes: project.reviewerNotes,
    dismissedRecommendations: project.dismissedRecommendations,
  };
}
