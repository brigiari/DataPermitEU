import { describe, expect, it } from "vitest";
import { getDataset } from "@/lib/data/datasets";
import { emptyApplication, DEMO_PROJECT } from "@/lib/data/demo";
import { completenessRecommendations } from "@/lib/recommendations/completeness";
import { purposeRecommendations } from "@/lib/recommendations/purpose";
import type { ApplicationDraft } from "@/lib/types";

const scor = getDataset("scor-se")!;
const spdr = getDataset("spdr-se")!;
const lmhp = getDataset("lmhp-it")!;

function complete(overrides: Partial<ApplicationDraft> = {}): ApplicationDraft {
  return { ...DEMO_PROJECT.application, ...overrides };
}

function ruleIds(findings: { ruleId: string }[]) {
  return findings.map((finding) => finding.ruleId);
}

describe("MIS-01 — unanswered sections", () => {
  it("flags every empty narrative field at attention level", () => {
    const findings = completenessRecommendations(emptyApplication(), []);
    const empties = findings.filter((finding) => finding.ruleId === "MIS-01");
    expect(empties.length).toBeGreaterThan(5);
    expect(empties.every((finding) => finding.severity === "attention")).toBe(true);
  });

  it("downgrades to advisory when a field is present but brief", () => {
    const findings = completenessRecommendations(
      complete({ researchPurpose: "We will look at heart failure readmission." }),
      [],
    );
    const purpose = findings.find(
      (finding) => finding.ruleId === "MIS-01" && finding.title.includes("Research purpose"),
    );
    expect(purpose?.severity).toBe("advisory");
  });

  it("flags an unset purpose category", () => {
    const findings = completenessRecommendations(complete({ purposeCategory: "" }), []);
    expect(findings.some((finding) => finding.id === "MIS-01:purpose-category")).toBe(true);
  });

  it("raises nothing for the fully written demo application", () => {
    const findings = completenessRecommendations(DEMO_PROJECT.application, [scor, spdr]);
    const purposeGaps = findings.filter(
      (finding) => finding.ruleId === "MIS-01" && finding.title.includes("Research purpose"),
    );
    expect(purposeGaps).toHaveLength(0);
  });
});

describe("MIS-02 — required documentation", () => {
  it("flags a document a selected dataset requires but the application has not attached", () => {
    const findings = completenessRecommendations(
      complete({
        documents: emptyApplication().documents,
      }),
      [scor],
    );
    const missing = findings.filter((finding) => finding.ruleId === "MIS-02");
    expect(missing.length).toBe(scor.accessConditions.requiredDocuments.length);
  });

  it("names which datasets require the document", () => {
    const findings = completenessRecommendations(
      complete({ documents: emptyApplication().documents }),
      [scor],
    );
    const ethics = findings.find((finding) => finding.id === "MIS-02:ethics-approval");
    expect(ethics?.reason).toContain("SCOR");
  });

  it("downgrades to advisory when the document is in preparation", () => {
    const findings = completenessRecommendations(DEMO_PROJECT.application, [scor]);
    const institutional = findings.find(
      (finding) => finding.id === "MIS-02:institutional-authorisation",
    );
    expect(institutional?.severity).toBe("advisory");
  });

  it("does not flag documents no selected dataset requires", () => {
    const findings = completenessRecommendations(
      complete({ documents: emptyApplication().documents }),
      [spdr],
    );
    // SPDR does not require a DPIA in the fictional catalogue.
    expect(findings.some((finding) => finding.id === "MIS-02:dpia")).toBe(false);
  });
});

describe("MIS-03 — ambiguous phrasing", () => {
  it("flags open-ended phrasing in a narrative field", () => {
    const findings = completenessRecommendations(
      complete({ researchPurpose: `${DEMO_PROJECT.application.researchPurpose} and other relevant variables etc` }),
      [],
    );
    const ambiguous = findings.find(
      (finding) => finding.ruleId === "MIS-03" && finding.title.includes("Research purpose"),
    );
    expect(ambiguous).toBeDefined();
    expect(ambiguous!.evidence.join(" ")).toContain("etc");
  });

  it("does not flag clean prose", () => {
    const findings = completenessRecommendations(DEMO_PROJECT.application, []);
    expect(findings.some((finding) => finding.ruleId === "MIS-03")).toBe(false);
  });
});

describe("MIS-04 — access duration", () => {
  it("flags a request longer than the shortest dataset maximum", () => {
    const findings = completenessRecommendations(complete({ requestedAccessMonths: 40 }), [scor]);
    const duration = findings.find((finding) => finding.ruleId === "MIS-04");
    expect(duration).toBeDefined();
    expect(duration!.severity).toBe("attention");
  });

  it("does not flag a request within the limit", () => {
    const findings = completenessRecommendations(complete({ requestedAccessMonths: 24 }), [scor]);
    expect(findings.some((finding) => finding.ruleId === "MIS-04")).toBe(false);
  });
});

describe("MIS-05 — study period against coverage", () => {
  it("flags a period reaching before the shared coverage window", () => {
    const findings = completenessRecommendations(
      complete({ timePeriod: { start: "1999-01-01", end: "2023-12-31" } }),
      [scor, spdr],
    );
    expect(findings.some((finding) => finding.ruleId === "MIS-05")).toBe(true);
  });

  it("does not flag a period inside the window", () => {
    const findings = completenessRecommendations(
      complete({ timePeriod: { start: "2015-01-01", end: "2023-12-31" } }),
      [scor, spdr],
    );
    expect(findings.some((finding) => finding.ruleId === "MIS-05")).toBe(false);
  });
});

describe("MIS-06 — linkage", () => {
  it("flags linkage requested against a dataset that supports none", () => {
    const findings = completenessRecommendations(complete({ linkageRequested: true }), [scor, lmhp]);
    const blocked = findings.find((finding) => finding.id === "MIS-06:linkage");
    expect(blocked).toBeDefined();
    expect(blocked!.title).toContain("LMHP");
  });

  it("flags a thin linkage justification", () => {
    const findings = completenessRecommendations(
      complete({ linkageRequested: true, linkageJustification: "We need it." }),
      [scor, spdr],
    );
    expect(findings.some((finding) => finding.id === "MIS-06:linkage-justification")).toBe(true);
  });

  it("raises nothing about linkage when none is requested", () => {
    const findings = completenessRecommendations(
      complete({ linkageRequested: false, linkageJustification: "" }),
      [scor, lmhp],
    );
    expect(ruleIds(findings).filter((id) => id === "MIS-06")).toHaveLength(0);
  });
});

describe("MIS-07 — attestations", () => {
  it("counts outstanding attestations", () => {
    const findings = completenessRecommendations(
      complete({
        attestations: {
          noReidentification: true,
          secureEnvironmentOnly: false,
          outputCheckingAccepted: false,
          guidanceIsEducational: true,
        },
      }),
      [],
    );
    const attestations = findings.find((finding) => finding.ruleId === "MIS-07");
    expect(attestations?.title).toContain("2 attestations");
  });

  it("raises nothing once all four are confirmed", () => {
    const findings = completenessRecommendations(DEMO_PROJECT.application, []);
    expect(findings.some((finding) => finding.ruleId === "MIS-07")).toBe(false);
  });
});

describe("MIS-08 — dataset contributing no variables", () => {
  it("flags a dataset in the project with nothing requested from it", () => {
    const findings = completenessRecommendations(DEMO_PROJECT.application, [
      scor,
      spdr,
      getDataset("finher-fi")!,
    ]);
    const orphan = findings.find((finding) => finding.id === "MIS-08:finher-fi");
    expect(orphan).toBeDefined();
    expect(orphan!.severity).toBe("advisory");
  });

  it("does not flag datasets that contribute variables", () => {
    const findings = completenessRecommendations(DEMO_PROJECT.application, [scor, spdr]);
    expect(findings.some((finding) => finding.ruleId === "MIS-08")).toBe(false);
  });
});

describe("purpose rules", () => {
  it("returns nothing for an empty application", () => {
    expect(purposeRecommendations(emptyApplication(), [scor])).toEqual([]);
  });

  it("flags language resembling a prohibited purpose", () => {
    const findings = purposeRecommendations(
      complete({ researchPurpose: "We will build an insurance underwriting risk model." }),
      [scor],
    );
    const concern = findings.find((finding) => finding.ruleId === "PUR-01");
    expect(concern).toBeDefined();
    expect(concern!.severity).toBe("attention");
  });

  it("flags language about contacting or identifying individuals", () => {
    const findings = purposeRecommendations(
      complete({ analysisPlan: "We will contact patients who screen positive." }),
      [scor],
    );
    expect(findings.some((finding) => finding.ruleId === "PUR-03")).toBe(true);
  });

  it("flags a public-interest justification that names no beneficiary", () => {
    const findings = purposeRecommendations(
      complete({ publicInterestJustification: "This is an interesting and novel scientific problem." }),
      [scor],
    );
    expect(findings.some((finding) => finding.ruleId === "PUR-02")).toBe(true);
  });

  it("accepts the demo project's public-interest justification", () => {
    const findings = purposeRecommendations(DEMO_PROJECT.application, [scor, spdr]);
    expect(findings.some((finding) => finding.ruleId === "PUR-02")).toBe(false);
  });

  it("flags an innovation purpose against datasets that do not permit it", () => {
    const findings = purposeRecommendations(
      complete({ purposeCategory: "innovation-development" }),
      [scor],
    );
    expect(findings.some((finding) => finding.id === "PUR-04:innovation-scope")).toBe(true);
  });

  it("raises no purpose concerns on the clean demo application", () => {
    expect(purposeRecommendations(DEMO_PROJECT.application, [scor, spdr])).toEqual([]);
  });

  it("is deterministic", () => {
    expect(purposeRecommendations(DEMO_PROJECT.application, [scor])).toEqual(
      purposeRecommendations(DEMO_PROJECT.application, [scor]),
    );
  });
});

describe("finding contract", () => {
  it("gives every completeness finding a reason, action and evidence", () => {
    const findings = completenessRecommendations(emptyApplication(), [scor, spdr]);
    for (const finding of findings) {
      expect(finding.reason.length).toBeGreaterThan(10);
      expect(finding.suggestedAction.length).toBeGreaterThan(10);
      expect(finding.evidence.length).toBeGreaterThan(0);
      expect(finding.source).toBe("deterministic-rules");
    }
  });

  it("produces unique ids", () => {
    const findings = completenessRecommendations(emptyApplication(), [scor, spdr]);
    expect(new Set(findings.map((finding) => finding.id)).size).toBe(findings.length);
  });
});
