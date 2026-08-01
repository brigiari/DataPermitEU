import { describe, expect, it } from "vitest";
import { DATASETS, getDataset } from "@/lib/data/datasets";
import { rankDatasets, relevanceRecommendations, scoreDatasetRelevance } from "@/lib/recommendations/relevance";

const ADHERENCE_QUESTION =
  "Does poor adherence to secondary-prevention medication after a cardiovascular hospital admission predict readmission?";

describe("scoreDatasetRelevance", () => {
  it("awards disease-area points when the question names a covered area", () => {
    const result = scoreDatasetRelevance(getDataset("scor-se")!, ADHERENCE_QUESTION);
    const component = result.components.find((entry) => entry.ruleId === "REL-01")!;
    expect(component.points).toBe(component.maxPoints);
  });

  it("awards no disease-area points when nothing matches", () => {
    const result = scoreDatasetRelevance(getDataset("rror-de")!, "asthma inhaler technique in children");
    const component = result.components.find((entry) => entry.ruleId === "REL-01")!;
    expect(component.points).toBe(0);
  });

  it("awards record-type points for a dispensing question against a dispensing dataset", () => {
    const result = scoreDatasetRelevance(getDataset("spdr-se")!, ADHERENCE_QUESTION);
    const component = result.components.find((entry) => entry.ruleId === "REL-02")!;
    expect(component.points).toBeGreaterThan(0);
  });

  it("penalises complex access in the fitness component", () => {
    const complex = scoreDatasetRelevance(getDataset("rror-de")!, "cancer staging and survival");
    const streamlined = scoreDatasetRelevance(getDataset("bdhlr-ee")!, "cancer staging and survival");
    const complexFitness = complex.components.find((entry) => entry.ruleId === "REL-04")!.points;
    const streamlinedFitness = streamlined.components.find((entry) => entry.ruleId === "REL-04")!.points;
    expect(streamlinedFitness).toBeGreaterThan(complexFitness);
  });

  it("keeps the total equal to the sum of its components", () => {
    const result = scoreDatasetRelevance(getDataset("scor-se")!, ADHERENCE_QUESTION);
    const sum = result.components.reduce((total, component) => total + component.points, 0);
    expect(result.score).toBe(sum);
  });

  it("never exceeds 100 or drops below 0", () => {
    for (const dataset of DATASETS) {
      const result = scoreDatasetRelevance(dataset, ADHERENCE_QUESTION);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it("bands scores consistently with the published thresholds", () => {
    for (const dataset of DATASETS) {
      const { score, band } = scoreDatasetRelevance(dataset, ADHERENCE_QUESTION);
      if (score >= 60) expect(band).toBe("Strong signal");
      else if (score >= 30) expect(band).toBe("Possible fit");
      else expect(band).toBe("Weak signal");
    }
  });

  it("explains an empty result rather than showing nothing", () => {
    const result = scoreDatasetRelevance(getDataset("fbmd-be")!, "prescription dispensing adherence");
    expect(result.headline.length).toBeGreaterThan(0);
    expect(result.components.every((component) => component.evidence.length > 0)).toBe(true);
  });

  it("is deterministic", () => {
    const a = scoreDatasetRelevance(getDataset("scor-se")!, ADHERENCE_QUESTION);
    const b = scoreDatasetRelevance(getDataset("scor-se")!, ADHERENCE_QUESTION);
    expect(a).toEqual(b);
  });
});

describe("rankDatasets", () => {
  it("ranks a cardiovascular register above an unrelated biobank directory for a cardiac question", () => {
    const ranked = rankDatasets(DATASETS, ADHERENCE_QUESTION);
    const positions = new Map(ranked.map((entry, index) => [entry.datasetId, index]));
    expect(positions.get("scor-se")!).toBeLessThan(positions.get("fbmd-be")!);
  });

  it("returns every dataset exactly once", () => {
    const ranked = rankDatasets(DATASETS, ADHERENCE_QUESTION);
    expect(ranked).toHaveLength(DATASETS.length);
    expect(new Set(ranked.map((entry) => entry.datasetId)).size).toBe(DATASETS.length);
  });

  it("breaks ties on id so the order is stable", () => {
    const first = rankDatasets(DATASETS, "").map((entry) => entry.datasetId);
    const second = rankDatasets(DATASETS, "").map((entry) => entry.datasetId);
    expect(first).toEqual(second);
  });
});

describe("relevanceRecommendations", () => {
  it("produces nothing for a question too short to score meaningfully", () => {
    expect(relevanceRecommendations(DATASETS, "heart", [])).toEqual([]);
  });

  it("excludes datasets already in the project", () => {
    const withoutSelection = relevanceRecommendations(DATASETS, ADHERENCE_QUESTION, []);
    expect(withoutSelection.some((finding) => finding.scope.datasetIds?.includes("scor-se"))).toBe(true);

    const withSelection = relevanceRecommendations(DATASETS, ADHERENCE_QUESTION, ["scor-se"]);
    expect(withSelection.some((finding) => finding.scope.datasetIds?.includes("scor-se"))).toBe(false);
  });

  it("attaches a reason, an action and evidence to every suggestion", () => {
    for (const finding of relevanceRecommendations(DATASETS, ADHERENCE_QUESTION, [])) {
      expect(finding.reason.length).toBeGreaterThan(10);
      expect(finding.suggestedAction.length).toBeGreaterThan(10);
      expect(finding.evidence.length).toBeGreaterThan(0);
      expect(finding.source).toBe("deterministic-rules");
    }
  });

  it("honours the result limit", () => {
    expect(relevanceRecommendations(DATASETS, ADHERENCE_QUESTION, [], 2).length).toBeLessThanOrEqual(2);
  });
});
