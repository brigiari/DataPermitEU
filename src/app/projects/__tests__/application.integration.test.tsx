import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationBuilder } from "@/app/projects/[id]/application/ApplicationBuilder";
import { MinimisationReview } from "@/app/projects/[id]/minimisation/MinimisationReview";
import { WorkspaceProvider } from "@/lib/store/WorkspaceProvider";
import { loadWorkspace, STORAGE_KEY } from "@/lib/store/persistence";
import { DEMO_PROJECT } from "@/lib/data/demo";

vi.mock("next/navigation", () => ({
  usePathname: () => `/projects/${DEMO_PROJECT.id}/application`,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

function renderBuilder() {
  return render(
    <WorkspaceProvider>
      <ApplicationBuilder projectId={DEMO_PROJECT.id} />
    </WorkspaceProvider>,
  );
}

function renderMinimisation() {
  return render(
    <WorkspaceProvider>
      <MinimisationReview projectId={DEMO_PROJECT.id} />
    </WorkspaceProvider>,
  );
}

describe("application builder", () => {
  it("opens on the purpose step with the demo content loaded", async () => {
    renderBuilder();
    expect(
      await screen.findByRole("heading", { name: /research purpose and public interest/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Research purpose/)).toHaveValue(
      DEMO_PROJECT.application.researchPurpose,
    );
  });

  it("marks the current step for assistive technology", async () => {
    renderBuilder();
    const nav = await screen.findByRole("navigation", { name: /application steps/i });
    expect(within(nav).getByRole("button", { name: /Purpose/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("moves between steps and shows the matching section", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const nav = await screen.findByRole("navigation", { name: /application steps/i });
    await user.click(within(nav).getByRole("button", { name: /Analysis and linkage/ }));

    expect(screen.getByRole("heading", { name: /analysis plan and linkage/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Analysis plan/)).toHaveValue(DEMO_PROJECT.application.analysisPlan);
  });

  it("advances with the Next control", async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(await screen.findByRole("button", { name: /Next →/ }));
    expect(screen.getByRole("heading", { name: /population and time period/i })).toBeInTheDocument();
  });

  it("autosaves edits to local storage after a debounce", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const field = await screen.findByLabelText(/public-interest justification/i);
    await user.clear(field);
    await user.type(field, "Patients benefit from targeted follow-up after discharge.");

    await waitFor(
      () => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        expect(stored).toContain("Patients benefit from targeted follow-up");
      },
      { timeout: 4000 },
    );
  }, 15000);

  it("restores autosaved edits on a fresh mount", async () => {
    const user = userEvent.setup();
    const { unmount } = renderBuilder();

    const field = await screen.findByLabelText(/public-interest justification/i);
    await user.clear(field);
    await user.type(field, "A distinctive replacement justification.");

    await waitFor(
      () => expect(window.localStorage.getItem(STORAGE_KEY)).toContain("distinctive replacement"),
      { timeout: 4000 },
    );
    unmount();

    const reloaded = loadWorkspace().projects.find((project) => project.id === DEMO_PROJECT.id)!;
    expect(reloaded.application.publicInterestJustification).toBe(
      "A distinctive replacement justification.",
    );
  }, 15000);

  it("shows a live word count against the guide length", async () => {
    renderBuilder();
    expect(await screen.findByText(/\d+ \/ 40 words suggested/)).toBeInTheDocument();
  });

  it("surfaces guidance for the current step in the sidebar", async () => {
    renderBuilder();
    expect(await screen.findByRole("heading", { name: /guidance for this step/i })).toBeInTheDocument();
  });

  it("derives the documentation checklist from the selected datasets", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const nav = await screen.findByRole("navigation", { name: /application steps/i });
    await user.click(within(nav).getByRole("button", { name: /Documentation/ }));

    expect(screen.getByRole("heading", { name: /documentation checklist/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Research ethics approval" })).toBeInTheDocument();
    // SCOR requires ethics approval in the fictional catalogue, so at least one
    // entry must be marked as required by a named dataset.
    expect(screen.getAllByText(/Required by SCOR/).length).toBeGreaterThan(0);
  });

  it("records a document status change", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const nav = await screen.findByRole("navigation", { name: /application steps/i });
    await user.click(within(nav).getByRole("button", { name: /Documentation/ }));

    const select = screen.getByLabelText(/status for publication and dissemination plan/i);
    await user.selectOptions(select, "attached");
    expect(select).toHaveValue("attached");
  });

  it("toggles a requested variable and reveals its justification field", async () => {
    const user = userEvent.setup();
    renderBuilder();

    const nav = await screen.findByRole("navigation", { name: /application steps/i });
    await user.click(within(nav).getByRole("button", { name: /Scope and variables/ }));

    const checkbox = screen.getByRole("checkbox", { name: /Smoking status/ });
    expect(checkbox).not.toBeChecked();

    // Scope assertions to this variable's own row: other demo variables are
    // already selected and render justification fields of their own.
    const row = checkbox.closest("li")!;
    expect(within(row).queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(
      within(row).getByLabelText(/why this variable is necessary/i, { selector: "textarea" }),
    ).toBeInTheDocument();
    expect(within(row).getByLabelText(/requested granularity/i)).toHaveValue("as-published");
  });
});

describe("minimisation review", () => {
  it("summarises the request and flags the demo project's weak spots", async () => {
    renderMinimisation();

    expect(
      await screen.findByRole("heading", { name: /is every variable in this request necessary/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Exact date of birth \(SCOR\) is classified as a direct identifier/ }),
    ).toBeInTheDocument();
  });

  it("reports how many variables carry a substantive justification", async () => {
    renderMinimisation();
    expect(await screen.findByText(/with a substantive justification/i)).toBeInTheDocument();
  });

  it("lists every requested variable in the request table", async () => {
    renderMinimisation();
    const table = await screen.findByRole("table", {
      name: /all \d+ requested variables/i,
    });
    const rows = within(table).getAllByRole("row");
    // One header row plus one row per requested variable.
    expect(rows).toHaveLength(DEMO_PROJECT.application.requestedVariables.length + 1);
  });

  it("marks an unjustified variable in the table", async () => {
    renderMinimisation();
    const table = await screen.findByRole("table", { name: /all \d+ requested variables/i });
    expect(within(table).getAllByText(/no justification recorded/i).length).toBeGreaterThan(0);
  });

  it("removes a finding from the list once dismissed and records it", async () => {
    const user = userEvent.setup();
    renderMinimisation();

    const heading = await screen.findByRole("heading", {
      name: /Exact date of birth \(SCOR\) is classified as a direct identifier/,
    });
    const card = heading.closest("article")!;
    await user.click(within(card).getByRole("button", { name: "Dismiss" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", {
          name: /Exact date of birth \(SCOR\) is classified as a direct identifier/,
        }),
      ).not.toBeInTheDocument(),
    );

    await waitFor(
      () => {
        const stored = loadWorkspace().projects.find((project) => project.id === DEMO_PROJECT.id)!;
        expect(stored.dismissedRecommendations).toContain("MIN-01:scor-se:scor-birthdate");
        expect(stored.auditTrail.at(-1)?.action).toBe("Recommendation dismissed");
      },
      { timeout: 4000 },
    );
  }, 15000);
});
