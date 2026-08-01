import { describe, expect, it } from "vitest";
import { getDataset } from "@/lib/data/datasets";
import {
  compatibilityMatrix,
  compatibilityRecommendations,
  governingConstraints,
  intersectCoverage,
  pairLinkage,
  pairTerminology,
} from "@/lib/recommendations/compatibility";
import { terminologyRecommendations } from "@/lib/recommendations/terminology";

const scor = getDataset("scor-se")!;
const spdr = getDataset("spdr-se")!;
const finher = getDataset("finher-fi")!;
const lmhp = getDataset("lmhp-it")!;
const vhda = getDataset("vhda-pl")!;
const rror = getDataset("rror-de")!;

describe("intersectCoverage", () => {
  it("returns the latest start and earliest end across datasets", () => {
    const coverage = intersectCoverage([scor, spdr]);
    expect(coverage.start).toBe(2006);
    expect(coverage.valid).toBe(true);
  });

  it("flags an empty intersection as invalid", () => {
    // VHDA ends in 2024; a hypothetical later-starting dataset would not overlap.
    const coverage = intersectCoverage([
      { ...vhda, timeCoverage: { start: 1992, end: 1995 } },
      { ...scor, timeCoverage: { start: 2005, end: "ongoing" } },
    ]);
    expect(coverage.valid).toBe(false);
  });

  it("treats an ongoing dataset as running to the current year", () => {
    const coverage = intersectCoverage([scor]);
    expect(coverage.end).toBe(new Date().getFullYear());
  });
});

describe("pairLinkage", () => {
  it("recognises an established link between two Swedish registers sharing a national key", () => {
    const result = pairLinkage(scor, spdr);
    expect(result.level).toBe("established");
    expect(result.feasible).toBe(true);
  });

  it("blocks any pair involving a dataset that supports no linkage", () => {
    const result = pairLinkage(scor, lmhp);
    expect(result.level).toBe("blocked");
    expect(result.feasible).toBe(false);
    expect(result.explanation).toContain(lmhp.acronym);
  });

  it("treats a cross-border pair with no shared key as not established", () => {
    const result = pairLinkage(scor, finher);
    expect(result.feasible).toBe(false);
    expect(result.level).toBe("possible");
    expect(result.explanation).toMatch(/jurisdiction/i);
  });

  it("is symmetric in its verdict", () => {
    expect(pairLinkage(scor, finher).level).toBe(pairLinkage(finher, scor).level);
    expect(pairLinkage(scor, lmhp).level).toBe(pairLinkage(lmhp, scor).level);
  });
});

describe("pairTerminology", () => {
  it("detects a diagnosis classification conflict between ICD-10 and ICD-11 datasets", () => {
    const result = pairTerminology(scor, finher);
    expect(result.diagnosisConflict.length).toBeGreaterThan(0);
    expect(result.diagnosisConflict).toContain("ICD-10");
    expect(result.diagnosisConflict).toContain("ICD-11");
  });

  it("reports no conflict when the datasets share a classification", () => {
    // SCOR and RROR both use ICD-10.
    expect(pairTerminology(scor, rror).diagnosisConflict).toEqual([]);
  });

  it("lists shared coding systems", () => {
    expect(pairTerminology(scor, spdr).shared).toContain("OMOP CDM v5.4");
  });

  it("identifies datasets declaring local proprietary codes", () => {
    expect(pairTerminology(vhda, scor).localOnly.map((d) => d.id)).toEqual(["vhda-pl"]);
  });
});

describe("governingConstraints", () => {
  it("takes the strictest aggregation threshold and shortest access period", () => {
    const constraints = governingConstraints([scor, rror]);
    expect(constraints.aggregationThreshold).toBe(10);
    expect(constraints.maximumAccessMonths).toBe(24);
  });

  it("requires a secure environment if any dataset does", () => {
    expect(governingConstraints([scor, vhda]).secureEnvironmentRequired).toBe(true);
  });

  it("lists distinct sorted countries", () => {
    expect(governingConstraints([finher, scor, spdr]).countries).toEqual(["Finland", "Sweden"]);
  });
});

describe("compatibilityMatrix", () => {
  it("produces one cell per unordered pair", () => {
    expect(compatibilityMatrix([scor, spdr, finher])).toHaveLength(3);
  });

  it("returns no cells for a single dataset", () => {
    expect(compatibilityMatrix([scor])).toHaveLength(0);
  });

  it("scores a same-country linked pair above a blocked cross-border pair", () => {
    const [linked] = compatibilityMatrix([scor, spdr]);
    const [blocked] = compatibilityMatrix([scor, lmhp]);
    expect(linked.score).toBeGreaterThan(blocked.score);
  });

  it("keeps every score within bounds", () => {
    for (const cell of compatibilityMatrix([scor, spdr, finher, lmhp, vhda])) {
      expect(cell.score).toBeGreaterThanOrEqual(0);
      expect(cell.score).toBeLessThanOrEqual(100);
    }
  });
});

describe("compatibilityRecommendations", () => {
  it("returns nothing for fewer than two datasets", () => {
    expect(compatibilityRecommendations([scor])).toEqual([]);
  });

  it("raises a cross-border finding when jurisdictions differ", () => {
    const findings = compatibilityRecommendations([scor, finher]);
    expect(findings.some((finding) => finding.ruleId === "CMP-02")).toBe(true);
  });

  it("raises no cross-border finding for two datasets in one country", () => {
    const findings = compatibilityRecommendations([scor, spdr]);
    expect(findings.some((finding) => finding.ruleId === "CMP-02")).toBe(false);
  });

  it("raises an attention-level linkage finding when a dataset supports none", () => {
    const findings = compatibilityRecommendations([scor, lmhp]);
    const linkage = findings.find((finding) => finding.ruleId === "CMP-01");
    expect(linkage?.severity).toBe("attention");
  });

  it("flags a closed archive combined with a continuously updated source", () => {
    const findings = compatibilityRecommendations([vhda, spdr]);
    expect(findings.some((finding) => finding.ruleId === "CMP-05")).toBe(true);
  });

  it("reports the governing constraints when conditions differ", () => {
    const findings = compatibilityRecommendations([scor, rror]);
    const governing = findings.find((finding) => finding.ruleId === "CMP-06");
    expect(governing).toBeDefined();
    expect(governing!.reason).toContain("10");
  });

  it("gives every finding a stable id, a reason and evidence", () => {
    for (const finding of compatibilityRecommendations([scor, spdr, finher, lmhp])) {
      expect(finding.id).toMatch(/^CMP-\d{2}:/);
      expect(finding.reason.length).toBeGreaterThan(10);
      expect(finding.evidence.length).toBeGreaterThan(0);
    }
  });

  it("produces identical output on repeated runs", () => {
    expect(compatibilityRecommendations([scor, spdr, finher])).toEqual(
      compatibilityRecommendations([scor, spdr, finher]),
    );
  });
});

describe("terminologyRecommendations", () => {
  it("raises TRM-01 for a diagnosis classification mismatch", () => {
    const findings = terminologyRecommendations([scor, finher]);
    expect(findings.some((finding) => finding.ruleId === "TRM-01")).toBe(true);
  });

  it("raises TRM-02 for a dataset using local proprietary codes", () => {
    const findings = terminologyRecommendations([vhda]);
    const local = findings.find((finding) => finding.ruleId === "TRM-02");
    expect(local).toBeDefined();
    expect(local!.scope.datasetIds).toEqual(["vhda-pl"]);
  });

  it("raises TRM-04 when only some datasets declare a common data model", () => {
    const findings = terminologyRecommendations([spdr, vhda]);
    expect(findings.some((finding) => finding.ruleId === "TRM-04")).toBe(true);
  });

  it("raises no partial-CDM finding when every dataset declares one", () => {
    const findings = terminologyRecommendations([spdr, ilreLike()]);
    expect(findings.some((finding) => finding.ruleId === "TRM-04")).toBe(false);
  });

  it("returns nothing for an empty project", () => {
    expect(terminologyRecommendations([])).toEqual([]);
  });
});

/** ILRE also declares OMOP, so a pair with SPDR has full CDM coverage. */
function ilreLike() {
  return getDataset("ilre-es")!;
}
