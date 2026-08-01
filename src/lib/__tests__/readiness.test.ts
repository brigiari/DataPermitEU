import { describe, expect, it } from "vitest";
import { DATASETS, DATASETS_BY_ID } from "@/lib/data/datasets";
import { DEMO_PROJECT, DEMO_PROJECT_EARLY, emptyApplication, newProject } from "@/lib/data/demo";
import { analyseProject, deterministicProvider, sortRecommendations, dedupeRecommendations, confidenceBand } from "@/lib/recommendations";
import { buildReadinessReport, dimensionFor } from "@/lib/readiness";
import { buildApplicationExport, buildAuditExport, EXPORT_DISCLAIMER } from "@/lib/export";
import type { Project } from "@/lib/types";

function datasetsOf(project: Project) {
  return project.datasetIds.map((id) => DATASETS_BY_ID[id]).filter(Boolean);
}

function findingsOf(project: Project) {
  return analyseProject({
    project,
    datasets: datasetsOf(project),
    application: project.application,
    catalogue: DATASETS,
  });
}

describe("buildReadinessReport", () => {
  it("scores an empty project at the bottom band", () => {
    const empty = newProject("empty", "Empty", "A question with enough words to score", "2026-01-01T00:00:00.000Z");
    const report = buildReadinessReport(empty, [], findingsOf(empty));
    expect(report.overall).toBeLessThan(20);
    expect(report.band).toBe("Not started");
  });

  it("scores the fully written demo project well above the early-stage one", () => {
    const demo = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), findingsOf(DEMO_PROJECT));
    const early = buildReadinessReport(
      DEMO_PROJECT_EARLY,
      datasetsOf(DEMO_PROJECT_EARLY),
      findingsOf(DEMO_PROJECT_EARLY),
    );
    expect(demo.overall).toBeGreaterThan(early.overall);
  });

  it("keeps every dimension score within bounds", () => {
    const report = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), findingsOf(DEMO_PROJECT));
    for (const dimension of report.dimensions) {
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      expect(dimension.score).toBeLessThanOrEqual(100);
    }
  });

  it("reports the overall as the mean of the dimensions", () => {
    const report = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), findingsOf(DEMO_PROJECT));
    const mean = Math.round(
      report.dimensions.reduce((total, dimension) => total + dimension.score, 0) /
        report.dimensions.length,
    );
    expect(report.overall).toBe(mean);
  });

  it("counts attached documents against those the selected datasets require", () => {
    const report = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), findingsOf(DEMO_PROJECT));
    expect(report.documentsRequired).toBeGreaterThan(0);
    expect(report.documentsAttached).toBeLessThanOrEqual(report.documentsRequired);
  });

  it("lists the demo project's outstanding documentation", () => {
    const report = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), findingsOf(DEMO_PROJECT));
    expect(report.missingDocuments).toContain("Institutional authorisation");
  });

  it("collects only attention-level findings as blocking", () => {
    const findings = findingsOf(DEMO_PROJECT);
    const report = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), findings);
    expect(report.blockingFindings.every((finding) => finding.severity === "attention")).toBe(true);
  });

  it("lowers a dimension score when findings are raised against it", () => {
    const findings = findingsOf(DEMO_PROJECT);
    const withFindings = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), findings);
    const withoutFindings = buildReadinessReport(DEMO_PROJECT, datasetsOf(DEMO_PROJECT), []);
    expect(withoutFindings.overall).toBeGreaterThanOrEqual(withFindings.overall);
  });
});

describe("dimensionFor", () => {
  it("routes minimisation findings to the scope dimension", () => {
    expect(
      dimensionFor({
        id: "x",
        kind: "data-minimisation",
        severity: "advisory",
        title: "t",
        reason: "r",
        suggestedAction: "a",
        evidence: [],
        ruleId: "MIN-01",
        scope: {},
        source: "deterministic-rules",
        confidence: 0.5,
      }),
    ).toBe("scope");
  });

  it("routes compatibility and terminology findings to the compatibility dimension", () => {
    for (const kind of ["cross-dataset-compatibility", "terminology-conflict"] as const) {
      expect(
        dimensionFor({
          id: "x",
          kind,
          severity: "advisory",
          title: "t",
          reason: "r",
          suggestedAction: "a",
          evidence: [],
          ruleId: "CMP-01",
          scope: {},
          source: "deterministic-rules",
          confidence: 0.5,
        }),
      ).toBe("compatibility");
    }
  });

  it("uses the declared section for missing-information findings", () => {
    expect(
      dimensionFor({
        id: "x",
        kind: "missing-information",
        severity: "attention",
        title: "t",
        reason: "r",
        suggestedAction: "a",
        evidence: [],
        ruleId: "MIS-01",
        scope: { section: "outputs" },
        source: "deterministic-rules",
        confidence: 0.9,
      }),
    ).toBe("outputs");
  });
});

describe("the provider contract", () => {
  it("is deterministic across repeated runs on identical input", () => {
    const context = {
      project: DEMO_PROJECT,
      datasets: datasetsOf(DEMO_PROJECT),
      application: DEMO_PROJECT.application,
      catalogue: DATASETS,
    };
    expect(deterministicProvider.analyse(context)).toEqual(deterministicProvider.analyse(context));
  });

  it("sorts attention findings before advisory and info", () => {
    const findings = findingsOf(DEMO_PROJECT);
    const ranks = findings.map((finding) =>
      finding.severity === "attention" ? 0 : finding.severity === "advisory" ? 1 : 2,
    );
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("gives every finding a reason, action, evidence and rule id", () => {
    const findings = findingsOf(DEMO_PROJECT);
    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      expect(finding.reason.length).toBeGreaterThan(10);
      expect(finding.suggestedAction.length).toBeGreaterThan(10);
      expect(finding.evidence.length).toBeGreaterThan(0);
      expect(finding.ruleId).toMatch(/^(REL|CMP|TRM|MIS|MIN|PUR)-\d{2}$/);
      expect(finding.confidence).toBeGreaterThanOrEqual(0);
      expect(finding.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("emits unique ids", () => {
    const findings = findingsOf(DEMO_PROJECT);
    expect(new Set(findings.map((finding) => finding.id)).size).toBe(findings.length);
  });

  it("removes findings the user has dismissed", () => {
    const findings = findingsOf(DEMO_PROJECT);
    const target = findings[0];
    const dismissed = analyseProject({
      project: { ...DEMO_PROJECT, dismissedRecommendations: [target.id] },
      datasets: datasetsOf(DEMO_PROJECT),
      application: DEMO_PROJECT.application,
      catalogue: DATASETS,
    });
    expect(dismissed.some((finding) => finding.id === target.id)).toBe(false);
    expect(dismissed).toHaveLength(findings.length - 1);
  });

  it("raises the minimisation findings the demo project was built to demonstrate", () => {
    const ids = findingsOf(DEMO_PROJECT).map((finding) => finding.id);
    expect(ids).toContain("MIN-01:scor-se:scor-birthdate");
    expect(ids).toContain("MIN-03:scor-se:scor-income");
    expect(ids).toContain("MIS-08:finher-fi");
  });

  it("raises the cross-border compatibility findings for the demo project", () => {
    const ruleIds = findingsOf(DEMO_PROJECT).map((finding) => finding.ruleId);
    expect(ruleIds).toContain("CMP-01");
    expect(ruleIds).toContain("CMP-02");
    expect(ruleIds).toContain("TRM-01");
  });
});

describe("sorting and deduplication helpers", () => {
  it("drops duplicate ids and keeps the first", () => {
    const one = findingsOf(DEMO_PROJECT)[0];
    expect(dedupeRecommendations([one, { ...one, title: "later" }])).toHaveLength(1);
    expect(dedupeRecommendations([one, { ...one, title: "later" }])[0].title).toBe(one.title);
  });

  it("orders equal severities by rule id then finding id", () => {
    const findings = findingsOf(DEMO_PROJECT);
    const sorted = sortRecommendations(findings);
    expect(sorted).toEqual(sortRecommendations(sorted));
  });

  it("bands confidence values qualitatively", () => {
    expect(confidenceBand(0.95)).toBe("High");
    expect(confidenceBand(0.6)).toBe("Moderate");
    expect(confidenceBand(0.2)).toBe("Low");
  });
});

describe("exports", () => {
  it("carries the independence disclaimer", () => {
    const payload = buildApplicationExport(
      DEMO_PROJECT,
      datasetsOf(DEMO_PROJECT),
      findingsOf(DEMO_PROJECT),
      "2026-03-01T00:00:00.000Z",
    );
    expect(payload.disclaimer).toBe(EXPORT_DISCLAIMER);
    expect(payload.disclaimer).toMatch(/fictional/i);
  });

  it("includes every open finding with its reason", () => {
    const findings = findingsOf(DEMO_PROJECT);
    const payload = buildApplicationExport(
      DEMO_PROJECT,
      datasetsOf(DEMO_PROJECT),
      findings,
      "2026-03-01T00:00:00.000Z",
    );
    expect(payload.openFindings).toHaveLength(findings.length);
    expect(payload.openFindings.every((finding) => finding.reason.length > 0)).toBe(true);
  });

  it("resolves requested variables to their names and sensitivity", () => {
    const payload = buildApplicationExport(
      DEMO_PROJECT,
      datasetsOf(DEMO_PROJECT),
      [],
      "2026-03-01T00:00:00.000Z",
    );
    const birthdate = payload.requestedVariablesDetailed.find(
      (entry) => entry.variable === "Exact date of birth",
    );
    expect(birthdate?.sensitivity).toBe("direct-identifier");
    expect(birthdate?.dataset).toBe("SCOR");
  });

  it("records the governing constraints across datasets", () => {
    const payload = buildApplicationExport(
      DEMO_PROJECT,
      datasetsOf(DEMO_PROJECT),
      [],
      "2026-03-01T00:00:00.000Z",
    );
    expect(payload.combinedConstraints.countries).toEqual(["Finland", "Sweden"]);
    expect(payload.combinedConstraints.secureProcessingEnvironmentRequired).toBe(true);
  });

  it("handles a project with no datasets without throwing", () => {
    const empty = newProject("e", "Empty", "A research question of sufficient length", "2026-01-01T00:00:00.000Z");
    const payload = buildApplicationExport(empty, [], [], "2026-03-01T00:00:00.000Z");
    expect(payload.datasets).toEqual([]);
    expect(payload.combinedConstraints.maximumAccessMonths).toBeNull();
    expect(payload.combinedConstraints.sharedCoverage).toBeNull();
  });

  it("serialises to valid JSON", () => {
    const payload = buildApplicationExport(
      DEMO_PROJECT,
      datasetsOf(DEMO_PROJECT),
      findingsOf(DEMO_PROJECT),
      "2026-03-01T00:00:00.000Z",
    );
    expect(() => JSON.parse(JSON.stringify(payload))).not.toThrow();
  });

  it("exports the audit trail with its disclaimer and dismissals", () => {
    const project = { ...DEMO_PROJECT, dismissedRecommendations: ["MIN-01:x"] };
    const payload = buildAuditExport(project, "2026-03-01T00:00:00.000Z");
    expect(payload.disclaimer).toBe(EXPORT_DISCLAIMER);
    expect(payload.entries).toHaveLength(DEMO_PROJECT.auditTrail.length);
    expect(payload.dismissedRecommendations).toEqual(["MIN-01:x"]);
  });
});

describe("empty application defaults", () => {
  it("starts with no variables, no attestations and a full document checklist", () => {
    const application = emptyApplication();
    expect(application.requestedVariables).toEqual([]);
    expect(Object.values(application.attestations).every((value) => value === false)).toBe(true);
    expect(application.documents.every((document) => document.status === "not-started")).toBe(true);
  });
});
