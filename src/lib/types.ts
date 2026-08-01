/**
 * Domain model for DataPermit EU.
 *
 * IMPORTANT: every entity described here is fictional. Dataset holders,
 * access bodies, identifiers, quality scores and approval outcomes were
 * invented for this prototype and do not describe any real catalogue,
 * institution, or Health Data Access Body.
 */

/* -------------------------------------------------------------------------- */
/* Controlled vocabularies                                                     */
/* -------------------------------------------------------------------------- */

export const COUNTRIES = [
  "Austria",
  "Belgium",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Ireland",
  "Italy",
  "Netherlands",
  "Poland",
  "Portugal",
  "Slovenia",
  "Spain",
  "Sweden",
] as const;
export type Country = (typeof COUNTRIES)[number];

export const DISEASE_AREAS = [
  "Cardiovascular",
  "Oncology",
  "Diabetes & Metabolic",
  "Mental Health",
  "Respiratory",
  "Infectious Disease",
  "Neurology",
  "Multi-morbidity",
] as const;
export type DiseaseArea = (typeof DISEASE_AREAS)[number];

export const DATA_CATEGORIES = [
  "Hospital discharge records",
  "Prescription & dispensing",
  "Laboratory results",
  "Disease registry",
  "Patient-reported outcomes",
  "Primary care records",
  "Imaging metadata",
  "Mortality & vital statistics",
  "Biobank & omics metadata",
] as const;
export type DataCategory = (typeof DATA_CATEGORIES)[number];

export const POPULATIONS = [
  "General population",
  "Adults (18+)",
  "Older adults (65+)",
  "Paediatric",
  "Pregnant persons",
  "Chronic disease cohort",
  "Hospitalised patients",
] as const;
export type Population = (typeof POPULATIONS)[number];

export const UPDATE_FREQUENCIES = [
  "Continuous",
  "Monthly",
  "Quarterly",
  "Annual",
  "Irregular",
] as const;
export type UpdateFrequency = (typeof UPDATE_FREQUENCIES)[number];

export const CODING_SYSTEMS = [
  "ICD-10",
  "ICD-11",
  "SNOMED CT",
  "ATC",
  "LOINC",
  "OPS/ICHI procedure codes",
  "ICPC-2",
  "Local proprietary codes",
  "OMOP CDM v5.4",
] as const;
export type CodingSystem = (typeof CODING_SYSTEMS)[number];

/** Coarse access-complexity banding used for filtering and readiness hints. */
export const ACCESS_COMPLEXITIES = ["Streamlined", "Standard", "Complex"] as const;
export type AccessComplexity = (typeof ACCESS_COMPLEXITIES)[number];

export const LINKAGE_STATUSES = [
  "National pseudonymous key available",
  "Project-specific linkage on request",
  "Deterministic linkage within holder only",
  "No linkage supported",
] as const;
export type LinkageStatus = (typeof LINKAGE_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* Catalogue entities                                                          */
/* -------------------------------------------------------------------------- */

/** Sensitivity banding drives the data-minimisation heuristics. */
export type VariableSensitivity = "low" | "moderate" | "high" | "direct-identifier";

export interface DatasetVariable {
  id: string;
  name: string;
  description: string;
  /** Broad analytical role, used by the minimisation layer. */
  category:
    | "demographic"
    | "clinical"
    | "medication"
    | "laboratory"
    | "administrative"
    | "outcome"
    | "socioeconomic"
    | "geographic"
    | "temporal"
    | "identifier";
  sensitivity: VariableSensitivity;
  /** Percentage of records where the variable is populated (0–100). */
  completeness: number;
  codingSystem?: CodingSystem;
  /** Present when the holder only releases a coarsened form by default. */
  defaultGranularity?: string;
}

export interface QualityIndicators {
  /** All scores are fictional and expressed 0–100. */
  completeness: number;
  timeliness: number;
  /** Degree of alignment with international terminologies. */
  interoperability: number;
  /** Stability of coding and collection practice across the time series. */
  consistency: number;
  /** Documentation and provenance transparency. */
  documentation: number;
  /** Free-text caveats surfaced on the dataset profile. */
  notes: string[];
}

export interface AccessBody {
  id: string;
  /** Fictional national access body name. */
  name: string;
  country: Country;
  jurisdiction: string;
  /** Indicative, fictional turnaround in working days. */
  indicativeDecisionDays: number;
}

export interface Dataset {
  id: string;
  name: string;
  acronym: string;
  holder: string;
  country: Country;
  accessBody: AccessBody;
  summary: string;
  diseaseAreas: DiseaseArea[];
  dataCategories: DataCategory[];
  populations: Population[];
  timeCoverage: { start: number; end: number | "ongoing" };
  updateFrequency: UpdateFrequency;
  codingSystems: CodingSystem[];
  approximateCohortSize: number;
  accessComplexity: AccessComplexity;
  linkage: {
    status: LinkageStatus;
    /** Dataset ids this holder has (fictionally) linked before. */
    knownLinkedDatasets: string[];
    notes: string;
  };
  variables: DatasetVariable[];
  quality: QualityIndicators;
  provenance: {
    collectionMethod: string;
    legalBasisSummary: string;
    curationProcess: string;
    lastAudited: string;
    versioning: string;
  };
  permittedPurposes: string[];
  prohibitedPurposes: string[];
  accessConditions: {
    secureProcessingEnvironmentRequired: boolean;
    outputChecking: string;
    minimumAggregationThreshold: number;
    requiredDocuments: RequiredDocumentId[];
    feeBand: "None" | "Cost recovery — low" | "Cost recovery — moderate" | "Cost recovery — high";
    maximumAccessMonths: number;
  };
  knownLimitations: string[];
  /** Fictional catalogue metadata. */
  catalogueRef: string;
  lastMetadataUpdate: string;
}

/* -------------------------------------------------------------------------- */
/* Application entities                                                        */
/* -------------------------------------------------------------------------- */

export const REQUIRED_DOCUMENT_IDS = [
  "ethics-approval",
  "study-protocol",
  "data-management-plan",
  "dpia",
  "legal-basis-statement",
  "institutional-authorisation",
  "researcher-accreditation",
  "publication-plan",
  "funding-declaration",
  "conflict-of-interest",
] as const;
export type RequiredDocumentId = (typeof REQUIRED_DOCUMENT_IDS)[number];

export interface DocumentRecord {
  id: RequiredDocumentId;
  status: "not-started" | "in-preparation" | "attached";
  reference: string;
  note: string;
}

export type ApplicationStatus =
  | "draft"
  | "internal-review"
  | "submitted"
  | "clarification-requested"
  | "approved"
  | "withdrawn";

/** A researcher's requested subset of a single dataset. */
export interface RequestedVariable {
  datasetId: string;
  variableId: string;
  /** Researcher's stated reason — the minimisation layer reads this. */
  justification: string;
  /** Whether the researcher accepted a coarser form. */
  granularity: "as-published" | "coarsened" | "derived-indicator";
}

export interface ApplicationDraft {
  /* Step 1 — purpose */
  researchPurpose: string;
  purposeCategory:
    | ""
    | "scientific-research"
    | "public-health"
    | "healthcare-quality"
    | "policy-support"
    | "innovation-development"
    | "education-training";
  publicInterestJustification: string;

  /* Step 2 — scope */
  requestedVariables: RequestedVariable[];
  populationDescription: string;
  timePeriod: { start: string; end: string };
  estimatedCohortSize: string;

  /* Step 3 — method */
  analysisPlan: string;
  statisticalMethods: string;
  linkageRequested: boolean;
  linkageJustification: string;

  /* Step 4 — governance */
  documents: DocumentRecord[];
  legalBasisNote: string;
  ethicsNote: string;

  /* Step 5 — duration and outputs */
  requestedAccessMonths: number | "";
  retentionPlan: string;
  expectedOutputs: string;
  outputDisclosureControls: string;
  dataDestructionPlan: string;

  /* Attestations */
  attestations: {
    noReidentification: boolean;
    secureEnvironmentOnly: boolean;
    outputCheckingAccepted: boolean;
    guidanceIsEducational: boolean;
  };
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: "researcher" | "reviewer" | "system";
  action: string;
  detail: string;
}

export interface ReviewerNote {
  id: string;
  timestamp: string;
  section: string;
  body: string;
  decision: "comment" | "clarification-requested" | "satisfied";
}

export interface Project {
  id: string;
  title: string;
  researchQuestion: string;
  principalInvestigator: string;
  institution: string;
  createdAt: string;
  updatedAt: string;
  /** Datasets added to the project workspace. */
  datasetIds: string[];
  application: ApplicationDraft;
  status: ApplicationStatus;
  /** Set once the mock application is "submitted". */
  submittedAt?: string;
  mockReference?: string;
  auditTrail: AuditEntry[];
  reviewerNotes: ReviewerNote[];
  /** Recommendation ids the user has explicitly dismissed. */
  dismissedRecommendations: string[];
}

export type Role = "researcher" | "reviewer";

/* -------------------------------------------------------------------------- */
/* Recommendation layer                                                        */
/* -------------------------------------------------------------------------- */

export type RecommendationKind =
  | "dataset-relevance"
  | "cross-dataset-compatibility"
  | "missing-information"
  | "data-minimisation"
  | "terminology-conflict"
  | "purpose-concern";

export type RecommendationSeverity = "info" | "advisory" | "attention";

/**
 * Every recommendation is advisory, explainable and dismissible. The shape is
 * intentionally provider-agnostic so a language model or terminology service
 * can populate it later without any UI change.
 */
export interface Recommendation {
  /** Stable id — used for dismissal, so it must be deterministic. */
  id: string;
  kind: RecommendationKind;
  severity: RecommendationSeverity;
  title: string;
  /** Plain-language explanation of *why* this was raised. */
  reason: string;
  /** What the researcher could do about it. Never phrased as an instruction. */
  suggestedAction: string;
  /** The rule or signal that produced it, shown in the UI for transparency. */
  evidence: string[];
  /** Identifier of the deterministic rule, for the methodology page. */
  ruleId: string;
  /** Where in the product the finding applies. */
  scope: { datasetIds?: string[]; variableIds?: string[]; section?: string };
  /** Provider that generated it — always "deterministic-rules" today. */
  source: "deterministic-rules";
  /** 0–1 heuristic strength. Displayed as a qualitative band, never a promise. */
  confidence: number;
}
