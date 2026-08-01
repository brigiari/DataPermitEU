import { describe, expect, it } from "vitest";
import { getDataset } from "@/lib/data/datasets";
import { emptyApplication, DEMO_PROJECT } from "@/lib/data/demo";
import {
  minimisationRecommendations,
  minimisationSummary,
} from "@/lib/recommendations/minimisation";
import type { ApplicationDraft, RequestedVariable } from "@/lib/types";

const scor = getDataset("scor-se")!;
const spdr = getDataset("spdr-se")!;
const rpcc = getDataset("rpcc-nl")!;

function draft(
  requestedVariables: RequestedVariable[],
  overrides: Partial<ApplicationDraft> = {},
): ApplicationDraft {
  return {
    ...emptyApplication(),
    researchPurpose:
      "We will estimate the association between medication adherence and cardiovascular readmission using a survival model adjusted for age and sex.",
    analysisPlan:
      "A cause-specific Cox model with adherence as the exposure and readmission as the outcome, adjusted for age, sex and disease severity.",
    requestedVariables,
    ...overrides,
  };
}

function ask(
  datasetId: string,
  variableId: string,
  justification = "",
  granularity: RequestedVariable["granularity"] = "as-published",
): RequestedVariable {
  return { datasetId, variableId, justification, granularity };
}

describe("MIN-01 — direct identifiers", () => {
  it("flags a variable classified as a direct identifier", () => {
    const findings = minimisationRecommendations({
      application: draft([
        ask("scor-se", "scor-birthdate", "Age at index event is needed for the adjusted model."),
      ]),
      datasets: [scor],
    });
    const finding = findings.find((entry) => entry.ruleId === "MIN-01");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("attention");
    expect(finding!.scope.variableIds).toEqual(["scor-birthdate"]);
  });

  it("mentions the holder's coarser default in the suggested action", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-birthdate", "Needed for age adjustment in the model.")]),
      datasets: [scor],
    });
    expect(findings.find((entry) => entry.ruleId === "MIN-01")!.suggestedAction).toContain(
      "birth year",
    );
  });

  it("does not flag a low-sensitivity variable", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-sex", "Pre-specified subgroup and confounder.")]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-01")).toBe(false);
  });
});

describe("MIN-02 — coarser form available", () => {
  it("flags a variable requested at full granularity when a coarser default exists", () => {
    const findings = minimisationRecommendations({
      application: draft([
        ask("scor-se", "scor-postcode", "Needed to describe geographic variation in readmission."),
      ]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-02")).toBe(true);
  });

  it("does not flag once the researcher accepts the coarser form", () => {
    const findings = minimisationRecommendations({
      application: draft([
        ask(
          "scor-se",
          "scor-postcode",
          "Needed to describe geographic variation in readmission.",
          "coarsened",
        ),
      ]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-02")).toBe(false);
  });
});

describe("MIN-03 — justification quality", () => {
  it("flags a high-sensitivity variable with no justification", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-income", "")]),
      datasets: [scor],
    });
    const finding = findings.find((entry) => entry.ruleId === "MIN-03");
    expect(finding).toBeDefined();
    expect(finding!.reason).toContain("empty");
  });

  it("flags a justification too short to assess", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-income", "Income")]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-03")).toBe(true);
  });

  it("accepts a substantive justification", () => {
    const findings = minimisationRecommendations({
      application: draft([
        ask(
          "scor-se",
          "scor-income",
          "Household income decile is required for the pre-specified socioeconomic inequality analysis of readmission risk.",
        ),
      ]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-03")).toBe(false);
  });

  it("does not require a justification for a low-sensitivity variable", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-sex", "")]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-03")).toBe(false);
  });
});

describe("MIN-04 — variable category unconnected to the purpose", () => {
  it("flags a socioeconomic variable when the purpose never mentions inequality", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-education", "")]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-04")).toBe(true);
  });

  it("stops flagging once the purpose describes a socioeconomic analysis", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-education", "")], {
        researchPurpose:
          "We will examine socioeconomic inequality in cardiovascular readmission, using education as a marker of deprivation.",
      }),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-04")).toBe(false);
  });

  it("stops flagging once a per-variable justification is written", () => {
    const findings = minimisationRecommendations({
      application: draft([
        ask(
          "scor-se",
          "scor-education",
          "Education level is included solely as a confounder in the adjusted readmission model.",
        ),
      ]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-04")).toBe(false);
  });

  it("never flags identifier-category variables, which are needed for linkage", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-pid", "")]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-04")).toBe(false);
  });
});

describe("MIN-05 — broad share of a dataset", () => {
  it("flags a request covering most of a dataset", () => {
    const most = scor.variables
      .slice(0, Math.ceil(scor.variables.length * 0.8))
      .map((variable) => ask("scor-se", variable.id, "Required for the analysis as described above."));
    const findings = minimisationRecommendations({
      application: draft(most),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-05")).toBe(true);
  });

  it("does not flag a narrow request", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-sex", "Confounder in the adjusted model, pre-specified.")]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-05")).toBe(false);
  });
});

describe("MIN-06 — free text", () => {
  it("flags an unstructured free-text field", () => {
    const findings = minimisationRecommendations({
      application: draft([
        ask("rpcc-nl", "rpcc-freetext", "Needed for a natural language processing sub-study of notes."),
      ]),
      datasets: [rpcc],
    });
    const finding = findings.find((entry) => entry.ruleId === "MIN-06");
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("attention");
  });
});

describe("MIN-07 — duplicate concepts across datasets", () => {
  it("flags the same concept requested from two datasets", () => {
    const findings = minimisationRecommendations({
      application: draft([
        ask("scor-se", "scor-birthyear", "Age adjustment in the primary model."),
        ask("spdr-se", "spdr-birthyear", "Age adjustment in the exposure model."),
      ]),
      datasets: [scor, spdr],
    });
    const finding = findings.find((entry) => entry.ruleId?.startsWith("MIN-07"));
    expect(finding).toBeDefined();
    expect(finding!.scope.datasetIds).toEqual(expect.arrayContaining(["scor-se", "spdr-se"]));
  });

  it("does not flag a concept requested from a single dataset", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("scor-se", "scor-birthyear", "Age adjustment in the primary model.")]),
      datasets: [scor],
    });
    expect(findings.some((entry) => entry.ruleId === "MIN-07")).toBe(false);
  });
});

describe("general contract", () => {
  it("returns nothing when no variables are requested", () => {
    expect(minimisationRecommendations({ application: draft([]), datasets: [scor] })).toEqual([]);
  });

  it("ignores a requested variable whose dataset is not in the project", () => {
    const findings = minimisationRecommendations({
      application: draft([ask("spdr-se", "spdr-prescriberid", "")]),
      datasets: [scor],
    });
    expect(findings).toEqual([]);
  });

  it("gives every finding a reason, an action and evidence", () => {
    const findings = minimisationRecommendations({
      application: DEMO_PROJECT.application,
      datasets: [scor, spdr],
    });
    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      expect(finding.reason.length).toBeGreaterThan(10);
      expect(finding.suggestedAction.length).toBeGreaterThan(10);
      expect(finding.evidence.length).toBeGreaterThan(0);
      expect(finding.kind).toBe("data-minimisation");
    }
  });

  it("is deterministic", () => {
    const context = { application: DEMO_PROJECT.application, datasets: [scor, spdr] };
    expect(minimisationRecommendations(context)).toEqual(minimisationRecommendations(context));
  });
});

describe("minimisationSummary", () => {
  it("counts requested variables by sensitivity band", () => {
    const summary = minimisationSummary({
      application: draft([
        ask("scor-se", "scor-sex", "x"),
        ask("scor-se", "scor-income", "x"),
        ask("scor-se", "scor-birthdate", "x"),
      ]),
      datasets: [scor],
    });
    expect(summary.totalRequested).toBe(3);
    expect(summary.bySensitivity.low).toBe(1);
    expect(summary.bySensitivity.high).toBe(1);
    expect(summary.bySensitivity["direct-identifier"]).toBe(1);
  });

  it("counts only substantive justifications", () => {
    const summary = minimisationSummary({
      application: draft([
        ask("scor-se", "scor-sex", "Sex"),
        ask("scor-se", "scor-lvef", "Ejection fraction is a strong independent predictor of readmission."),
      ]),
      datasets: [scor],
    });
    expect(summary.withJustification).toBe(1);
  });

  it("counts variables requested at reduced granularity", () => {
    const summary = minimisationSummary({
      application: draft([ask("scor-se", "scor-postcode", "x", "coarsened")]),
      datasets: [scor],
    });
    expect(summary.coarsened).toBe(1);
  });
});
