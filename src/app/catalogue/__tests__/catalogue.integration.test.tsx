import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogueClient } from "@/app/catalogue/CatalogueClient";
import { WorkspaceProvider } from "@/lib/store/WorkspaceProvider";
import { DATASETS } from "@/lib/data/datasets";

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalogue",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

function renderCatalogue() {
  return render(
    <WorkspaceProvider>
      <CatalogueClient />
    </WorkspaceProvider>,
  );
}

async function resultCount() {
  const status = await screen.findByText(/of \d+ datasets/);
  return Number(status.textContent!.match(/^(\d+)/)![1]);
}

describe("catalogue discovery", () => {
  it("lists the whole catalogue on first render", async () => {
    renderCatalogue();
    expect(await resultCount()).toBe(DATASETS.length);
  });

  it("narrows results as the user types a query", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.type(screen.getByLabelText(/search datasets/i), "dispensing");
    const narrowed = await resultCount();

    expect(narrowed).toBeGreaterThan(0);
    expect(narrowed).toBeLessThan(DATASETS.length);
  });

  it("finds a dataset by its acronym", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.type(screen.getByLabelText(/search datasets/i), "SCOR");
    expect(
      await screen.findByRole("link", { name: "Svea Cardiovascular Outcomes Register" }),
    ).toBeInTheDocument();
  });

  it("filters by a country facet and shows a removable chip", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    const facets = screen.getByRole("complementary", { name: /catalogue filters/i });
    await user.click(within(facets).getByRole("checkbox", { name: /Sweden/ }));

    const filtered = await resultCount();
    expect(filtered).toBe(DATASETS.filter((dataset) => dataset.country === "Sweden").length);

    const chip = screen.getByRole("button", { name: /remove filter sweden/i });
    await user.click(chip);
    expect(await resultCount()).toBe(DATASETS.length);
  });

  it("combines facets across groups with AND", async () => {
    const user = userEvent.setup();
    renderCatalogue();
    const facets = screen.getByRole("complementary", { name: /catalogue filters/i });

    await user.click(within(facets).getByRole("checkbox", { name: /Sweden/ }));
    await user.click(within(facets).getByRole("checkbox", { name: /Cardiovascular/ }));

    const expected = DATASETS.filter(
      (dataset) => dataset.country === "Sweden" && dataset.diseaseAreas.includes("Cardiovascular"),
    ).length;
    expect(await resultCount()).toBe(expected);
  });

  it("clears every filter at once", async () => {
    const user = userEvent.setup();
    renderCatalogue();
    const facets = screen.getByRole("complementary", { name: /catalogue filters/i });

    await user.click(within(facets).getByRole("checkbox", { name: /Sweden/ }));
    expect(await resultCount()).toBeLessThan(DATASETS.length);

    await user.click(screen.getAllByRole("button", { name: /clear all filters/i })[0]);
    expect(await resultCount()).toBe(DATASETS.length);
  });

  it("shows an empty state with a recovery action when nothing matches", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.type(screen.getByLabelText(/search datasets/i), "zzzznothingmatches");

    expect(await screen.findByText(/no datasets match these filters/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /clear all filters/i }).length).toBeGreaterThan(0);
  });

  it("adds a dataset to the active project and reflects it in the button", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.type(screen.getByLabelText(/search datasets/i), "Rhein-Ruhr");
    const card = (await screen.findByRole("link", { name: /Rhein-Ruhr Oncology Registry/ })).closest(
      "article",
    )!;

    await user.click(within(card).getByRole("button", { name: /add to project/i }));
    expect(await within(card).findByRole("button", { name: /remove from project/i })).toBeInTheDocument();
    expect(within(card).getByText("In project")).toBeInTheDocument();
  });

  it("announces the result count in a live region", async () => {
    renderCatalogue();
    const status = await screen.findByText(/of \d+ datasets/);
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("keeps facet groups collapsible with correct expanded state", async () => {
    const user = userEvent.setup();
    renderCatalogue();
    const facets = screen.getByRole("complementary", { name: /catalogue filters/i });

    const toggle = within(facets).getByRole("button", { name: /^Data category/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
