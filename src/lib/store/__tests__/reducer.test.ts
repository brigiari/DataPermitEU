import { beforeEach, describe, expect, it } from "vitest";
import { workspaceReducer } from "@/lib/store/reducer";
import {
  clearWorkspace,
  initialWorkspace,
  loadWorkspace,
  saveWorkspace,
  STORAGE_KEY,
  type WorkspaceState,
} from "@/lib/store/persistence";
import { DEMO_PROJECT } from "@/lib/data/demo";

const NOW = "2026-03-01T10:00:00.000Z";

function base(): WorkspaceState {
  return initialWorkspace();
}

describe("project lifecycle", () => {
  it("creates a project and makes it active", () => {
    const state = workspaceReducer(base(), {
      type: "create-project",
      id: "p1",
      title: "New study",
      researchQuestion: "Does X predict Y?",
      now: NOW,
    });
    expect(state.projects.some((project) => project.id === "p1")).toBe(true);
    expect(state.activeProjectId).toBe("p1");
  });

  it("writes a creation entry to the audit trail", () => {
    const state = workspaceReducer(base(), {
      type: "create-project",
      id: "p1",
      title: "New study",
      researchQuestion: "Does X predict Y?",
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === "p1")!;
    expect(project.auditTrail).toHaveLength(1);
    expect(project.auditTrail[0].action).toBe("Project created");
  });

  it("deletes a project and reassigns the active id", () => {
    const start = base();
    const state = workspaceReducer(start, {
      type: "delete-project",
      projectId: start.activeProjectId!,
    });
    expect(state.projects).toHaveLength(start.projects.length - 1);
    expect(state.activeProjectId).not.toBe(start.activeProjectId);
    expect(state.projects.some((project) => project.id === state.activeProjectId)).toBe(true);
  });

  it("updates project metadata and the updated timestamp", () => {
    const state = workspaceReducer(base(), {
      type: "update-project-meta",
      projectId: DEMO_PROJECT.id,
      patch: { title: "Renamed", institution: "A new institute" },
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.title).toBe("Renamed");
    expect(project.institution).toBe("A new institute");
    expect(project.updatedAt).toBe(NOW);
  });
});

describe("dataset selection", () => {
  it("adds a dataset and logs it", () => {
    const state = workspaceReducer(base(), {
      type: "add-dataset",
      projectId: DEMO_PROJECT.id,
      datasetId: "rror-de",
      datasetLabel: "RROR — Rhein-Ruhr Oncology Registry",
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.datasetIds).toContain("rror-de");
    expect(project.auditTrail.at(-1)?.action).toBe("Dataset added");
  });

  it("is idempotent when adding a dataset already in the project", () => {
    const start = base();
    const state = workspaceReducer(start, {
      type: "add-dataset",
      projectId: DEMO_PROJECT.id,
      datasetId: "scor-se",
      datasetLabel: "SCOR",
      now: NOW,
    });
    const before = start.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    const after = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(after.datasetIds).toEqual(before.datasetIds);
    expect(after.auditTrail).toHaveLength(before.auditTrail.length);
  });

  it("removes a dataset and drops its requested variables", () => {
    const state = workspaceReducer(base(), {
      type: "remove-dataset",
      projectId: DEMO_PROJECT.id,
      datasetId: "spdr-se",
      datasetLabel: "SPDR",
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.datasetIds).not.toContain("spdr-se");
    expect(
      project.application.requestedVariables.some((variable) => variable.datasetId === "spdr-se"),
    ).toBe(false);
  });
});

describe("variable selection", () => {
  it("adds a variable with an empty justification and default granularity", () => {
    const state = workspaceReducer(base(), {
      type: "toggle-variable",
      projectId: DEMO_PROJECT.id,
      datasetId: "scor-se",
      variableId: "scor-smoking",
      variableLabel: "Smoking status (SCOR)",
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    const added = project.application.requestedVariables.find(
      (variable) => variable.variableId === "scor-smoking",
    );
    expect(added).toEqual({
      datasetId: "scor-se",
      variableId: "scor-smoking",
      justification: "",
      granularity: "as-published",
    });
  });

  it("toggles a variable off when it is already requested", () => {
    const once = workspaceReducer(base(), {
      type: "toggle-variable",
      projectId: DEMO_PROJECT.id,
      datasetId: "scor-se",
      variableId: "scor-smoking",
      variableLabel: "Smoking status",
      now: NOW,
    });
    const twice = workspaceReducer(once, {
      type: "toggle-variable",
      projectId: DEMO_PROJECT.id,
      datasetId: "scor-se",
      variableId: "scor-smoking",
      variableLabel: "Smoking status",
      now: NOW,
    });
    const project = twice.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(
      project.application.requestedVariables.some((variable) => variable.variableId === "scor-smoking"),
    ).toBe(false);
  });

  it("updates a single requested variable without touching the others", () => {
    const state = workspaceReducer(base(), {
      type: "update-requested-variable",
      projectId: DEMO_PROJECT.id,
      datasetId: "scor-se",
      variableId: "scor-income",
      patch: { justification: "Required for the pre-specified inequality analysis." },
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    const updated = project.application.requestedVariables.find(
      (variable) => variable.variableId === "scor-income",
    );
    expect(updated?.justification).toContain("inequality");
    expect(project.application.requestedVariables).toHaveLength(
      DEMO_PROJECT.application.requestedVariables.length,
    );
  });
});

describe("recommendations and audit", () => {
  it("records a dismissal in the audit trail rather than hiding it", () => {
    const state = workspaceReducer(base(), {
      type: "dismiss-recommendation",
      projectId: DEMO_PROJECT.id,
      recommendationId: "MIN-01:scor-se:scor-birthdate",
      title: "Exact date of birth is a direct identifier",
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.dismissedRecommendations).toContain("MIN-01:scor-se:scor-birthdate");
    expect(project.auditTrail.at(-1)?.action).toBe("Recommendation dismissed");
  });

  it("does not record a duplicate dismissal twice", () => {
    const once = workspaceReducer(base(), {
      type: "dismiss-recommendation",
      projectId: DEMO_PROJECT.id,
      recommendationId: "MIN-01:x",
      title: "t",
      now: NOW,
    });
    const twice = workspaceReducer(once, {
      type: "dismiss-recommendation",
      projectId: DEMO_PROJECT.id,
      recommendationId: "MIN-01:x",
      title: "t",
      now: NOW,
    });
    const project = twice.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.dismissedRecommendations.filter((id) => id === "MIN-01:x")).toHaveLength(1);
  });

  it("restores a dismissed recommendation", () => {
    const dismissed = workspaceReducer(base(), {
      type: "dismiss-recommendation",
      projectId: DEMO_PROJECT.id,
      recommendationId: "MIN-01:x",
      title: "t",
      now: NOW,
    });
    const restored = workspaceReducer(dismissed, {
      type: "restore-recommendation",
      projectId: DEMO_PROJECT.id,
      recommendationId: "MIN-01:x",
      now: NOW,
    });
    const project = restored.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.dismissedRecommendations).not.toContain("MIN-01:x");
  });

  it("only ever appends to the audit trail", () => {
    const start = base();
    const before = start.projects.find((entry) => entry.id === DEMO_PROJECT.id)!.auditTrail;
    const state = workspaceReducer(start, {
      type: "add-dataset",
      projectId: DEMO_PROJECT.id,
      datasetId: "rror-de",
      datasetLabel: "RROR",
      now: NOW,
    });
    const after = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!.auditTrail;
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after).toHaveLength(before.length + 1);
  });
});

describe("status transitions", () => {
  it("stamps a submission timestamp and a mock reference", () => {
    const state = workspaceReducer(base(), {
      type: "set-status",
      projectId: DEMO_PROJECT.id,
      status: "submitted",
      now: NOW,
      reference: "MOCK-DEMO-2026",
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.status).toBe("submitted");
    expect(project.submittedAt).toBe(NOW);
    expect(project.mockReference).toBe("MOCK-DEMO-2026");
  });

  it("attributes an approval to the reviewer in the audit trail", () => {
    const state = workspaceReducer(base(), {
      type: "set-status",
      projectId: DEMO_PROJECT.id,
      status: "approved",
      now: NOW,
    });
    const project = state.projects.find((entry) => entry.id === DEMO_PROJECT.id)!;
    expect(project.auditTrail.at(-1)?.actor).toBe("reviewer");
  });
});

describe("immutability", () => {
  it("never mutates the previous state object", () => {
    const start = base();
    const snapshot = structuredClone(start);
    workspaceReducer(start, {
      type: "add-dataset",
      projectId: DEMO_PROJECT.id,
      datasetId: "rror-de",
      datasetLabel: "RROR",
      now: NOW,
    });
    expect(start).toEqual(snapshot);
  });

  it("returns the same state for an unknown project id", () => {
    const start = base();
    const state = workspaceReducer(start, {
      type: "add-dataset",
      projectId: "does-not-exist",
      datasetId: "rror-de",
      datasetLabel: "RROR",
      now: NOW,
    });
    expect(state.projects).toEqual(start.projects);
  });
});

describe("persistence", () => {
  beforeEach(() => {
    clearWorkspace();
  });

  it("returns the demo workspace when nothing is stored", () => {
    const loaded = loadWorkspace();
    expect(loaded.projects.length).toBeGreaterThan(0);
    expect(loaded.projects[0].id).toBe(DEMO_PROJECT.id);
  });

  it("round-trips a saved workspace", () => {
    const state = workspaceReducer(base(), {
      type: "create-project",
      id: "round-trip",
      title: "Round trip",
      researchQuestion: "Does persistence work?",
      now: NOW,
    });
    expect(saveWorkspace(state)).toBe(true);
    const loaded = loadWorkspace();
    expect(loaded.projects.some((project) => project.id === "round-trip")).toBe(true);
    expect(loaded.activeProjectId).toBe("round-trip");
  });

  it("falls back to the demo workspace when stored data is corrupt", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(loadWorkspace().projects[0].id).toBe(DEMO_PROJECT.id);
  });

  it("falls back when the stored version is unrecognised", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, projects: [] }));
    expect(loadWorkspace().projects[0].id).toBe(DEMO_PROJECT.id);
  });

  it("normalises an unexpected role value", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, projects: [], role: "administrator" }),
    );
    expect(loadWorkspace().role).toBe("researcher");
  });

  it("gives each demo project an independent copy so edits do not leak", () => {
    const a = initialWorkspace();
    a.projects[0].title = "Mutated";
    expect(initialWorkspace().projects[0].title).toBe(DEMO_PROJECT.title);
  });
});
