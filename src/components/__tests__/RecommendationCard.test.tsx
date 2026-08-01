import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecommendationCard, RecommendationList } from "@/components/RecommendationCard";
import type { Recommendation } from "@/lib/types";

const finding: Recommendation = {
  id: "MIN-01:scor-se:scor-birthdate",
  kind: "data-minimisation",
  severity: "attention",
  title: "Exact date of birth (SCOR) is classified as a direct identifier",
  reason:
    "The catalogue classifies this variable as directly identifying. The holder's default release is: Released as birth year unless justified.",
  suggestedAction:
    "Switch this variable to the holder's default form unless your analysis genuinely requires the identifying detail.",
  evidence: ["Sensitivity classification: direct-identifier", "Variable category: demographic"],
  ruleId: "MIN-01",
  scope: { datasetIds: ["scor-se"], variableIds: ["scor-birthdate"] },
  source: "deterministic-rules",
  confidence: 0.9,
};

describe("RecommendationCard", () => {
  it("shows the claim, the reason and the suggested action", () => {
    render(<RecommendationCard finding={finding} />);
    expect(screen.getByRole("heading", { name: finding.title })).toBeInTheDocument();
    expect(screen.getByText(/classifies this variable as directly identifying/)).toBeInTheDocument();
    expect(screen.getByText(/Switch this variable to the holder/)).toBeInTheDocument();
  });

  it("labels the severity and names the rule that produced it", () => {
    render(<RecommendationCard finding={finding} />);
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("MIN-01")).toBeInTheDocument();
    expect(screen.getByText(/Confidence: High/)).toBeInTheDocument();
  });

  it("keeps evidence collapsed until the user asks for it", async () => {
    const user = userEvent.setup();
    render(<RecommendationCard finding={finding} />);

    const toggle = screen.getByRole("button", { name: /show the evidence/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Evidence")).not.toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("Sensitivity classification: direct-identifier")).toBeInTheDocument();
  });

  it("discloses the rule's known weakness alongside its evidence", async () => {
    const user = userEvent.setup();
    render(<RecommendationCard finding={finding} />);
    await user.click(screen.getByRole("button", { name: /show the evidence/i }));
    expect(screen.getByText(/Known weakness:/)).toBeInTheDocument();
  });

  it("links to the dataset a finding applies to", () => {
    render(<RecommendationCard finding={finding} />);
    expect(screen.getByRole("link", { name: "SCOR" })).toHaveAttribute("href", "/catalogue/scor-se");
  });

  it("lets the user dismiss a finding", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<RecommendationCard finding={finding} onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledWith(finding);
  });

  it("offers restore rather than dismiss for a dismissed finding", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<RecommendationCard finding={finding} dismissed onRestore={onRestore} />);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(onRestore).toHaveBeenCalledWith(finding);
  });

  it("hides the dismiss control and evidence toggle in compact mode", () => {
    render(<RecommendationCard finding={finding} compact />);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show the evidence/i })).not.toBeInTheDocument();
    // The reason must still be visible — compact never means unexplained.
    expect(screen.getByText(/classifies this variable as directly identifying/)).toBeInTheDocument();
  });

  it("renders an advisory finding with its own label", () => {
    render(<RecommendationCard finding={{ ...finding, severity: "advisory", confidence: 0.4 }} />);
    expect(screen.getByText("Advisory")).toBeInTheDocument();
    expect(screen.getByText(/Confidence: Low/)).toBeInTheDocument();
  });
});

describe("RecommendationList", () => {
  it("shows an explanatory message when there is nothing to report", () => {
    render(<RecommendationList findings={[]} emptyMessage="No findings raised." />);
    expect(screen.getByText("No findings raised.")).toBeInTheDocument();
  });

  it("renders one card per finding", () => {
    render(
      <RecommendationList
        findings={[finding, { ...finding, id: "MIN-02:x", title: "A second finding" }]}
        emptyMessage="none"
      />,
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
});
