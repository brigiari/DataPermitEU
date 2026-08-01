import type { DocumentRecord, RequiredDocumentId } from "@/lib/types";
import { REQUIRED_DOCUMENT_IDS } from "@/lib/types";

export const DOCUMENT_LABELS: Record<RequiredDocumentId, string> = {
  "ethics-approval": "Research ethics approval",
  "study-protocol": "Study protocol",
  "data-management-plan": "Data management plan",
  dpia: "Data protection impact assessment",
  "legal-basis-statement": "Legal basis statement",
  "institutional-authorisation": "Institutional authorisation",
  "researcher-accreditation": "Researcher accreditation",
  "publication-plan": "Publication and dissemination plan",
  "funding-declaration": "Funding declaration",
  "conflict-of-interest": "Conflict of interest declaration",
};

export const DOCUMENT_DESCRIPTIONS: Record<RequiredDocumentId, string> = {
  "ethics-approval":
    "Decision from the research ethics committee with jurisdiction over the study, including its reference number.",
  "study-protocol":
    "The full protocol: objectives, design, population, exposures and outcomes, sample size and analysis.",
  "data-management-plan":
    "How the data will be stored, who may access it, how access is logged, and what happens at the end of the project.",
  dpia:
    "Assessment of risks to individuals from the processing, and the measures chosen to reduce them.",
  "legal-basis-statement":
    "A statement of the basis relied on for processing, prepared with your own legal advisers.",
  "institutional-authorisation":
    "Confirmation that the host institution accepts responsibility for the project and its data handling.",
  "researcher-accreditation":
    "Evidence that named researchers have completed the accreditation or training the holder requires.",
  "publication-plan":
    "How and where results will be published, including any embargo or holder-review arrangements.",
  "funding-declaration": "Sources of funding for the study and any conditions attached to them.",
  "conflict-of-interest":
    "Declared interests for each named researcher that could bear on the study's independence.",
};

/** A fresh, empty document checklist covering every document type. */
export function emptyDocumentRecords(): DocumentRecord[] {
  return REQUIRED_DOCUMENT_IDS.map((id) => ({
    id,
    status: "not-started" as const,
    reference: "",
    note: "",
  }));
}
