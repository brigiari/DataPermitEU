import type {
  ApplicationDraft,
  AuditEntry,
  Project,
  RequestedVariable,
  ReviewerNote,
  Role,
} from "@/lib/types";
import { newProject } from "@/lib/data/demo";
import type { WorkspaceState } from "@/lib/store/persistence";
import { initialWorkspace } from "@/lib/store/persistence";

export type WorkspaceAction =
  | { type: "hydrate"; state: WorkspaceState }
  | { type: "set-role"; role: Role }
  | { type: "set-active-project"; projectId: string | null }
  | { type: "create-project"; id: string; title: string; researchQuestion: string; now: string }
  | { type: "delete-project"; projectId: string }
  | {
      type: "update-project-meta";
      projectId: string;
      patch: Partial<Pick<Project, "title" | "researchQuestion" | "principalInvestigator" | "institution">>;
      now: string;
    }
  | { type: "add-dataset"; projectId: string; datasetId: string; datasetLabel: string; now: string }
  | { type: "remove-dataset"; projectId: string; datasetId: string; datasetLabel: string; now: string }
  | { type: "update-application"; projectId: string; patch: Partial<ApplicationDraft>; now: string; note?: string }
  | { type: "set-requested-variables"; projectId: string; variables: RequestedVariable[]; now: string }
  | {
      type: "toggle-variable";
      projectId: string;
      datasetId: string;
      variableId: string;
      variableLabel: string;
      now: string;
    }
  | {
      type: "update-requested-variable";
      projectId: string;
      datasetId: string;
      variableId: string;
      patch: Partial<Omit<RequestedVariable, "datasetId" | "variableId">>;
      now: string;
    }
  | { type: "dismiss-recommendation"; projectId: string; recommendationId: string; title: string; now: string }
  | { type: "restore-recommendation"; projectId: string; recommendationId: string; now: string }
  | { type: "set-status"; projectId: string; status: Project["status"]; now: string; reference?: string }
  | { type: "add-reviewer-note"; projectId: string; note: ReviewerNote }
  | { type: "reset-workspace" }
  | { type: "mark-saved"; at: string };

function auditEntry(now: string, actor: AuditEntry["actor"], action: string, detail: string): AuditEntry {
  return {
    // Deterministic within a session and unique enough for an append-only log.
    id: `${now}-${action.toLowerCase().replace(/[^a-z]+/g, "-")}-${Math.abs(hash(detail))}`,
    timestamp: now,
    actor,
    action,
    detail,
  };
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result << 5) - result + value.charCodeAt(index);
    result |= 0;
  }
  return result;
}

function withProject(
  state: WorkspaceState,
  projectId: string,
  update: (project: Project) => Project,
): WorkspaceState {
  return {
    ...state,
    projects: state.projects.map((project) => (project.id === projectId ? update(project) : project)),
  };
}

function appendAudit(project: Project, entry: AuditEntry): Project {
  return { ...project, auditTrail: [...project.auditTrail, entry] };
}

/**
 * All workspace mutations flow through this reducer, which is what makes the
 * audit trail trustworthy: an action that changes the application also writes
 * its own log entry, so the two cannot drift apart.
 */
export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "mark-saved":
      return { ...state, lastSavedAt: action.at };

    case "set-role":
      return { ...state, role: action.role };

    case "set-active-project":
      return { ...state, activeProjectId: action.projectId };

    case "create-project": {
      const project = newProject(action.id, action.title, action.researchQuestion, action.now);
      return { ...state, projects: [...state.projects, project], activeProjectId: project.id };
    }

    case "delete-project": {
      const projects = state.projects.filter((project) => project.id !== action.projectId);
      return {
        ...state,
        projects,
        activeProjectId:
          state.activeProjectId === action.projectId ? (projects[0]?.id ?? null) : state.activeProjectId,
      };
    }

    case "update-project-meta":
      return withProject(state, action.projectId, (project) => ({
        ...project,
        ...action.patch,
        updatedAt: action.now,
      }));

    case "add-dataset":
      return withProject(state, action.projectId, (project) =>
        project.datasetIds.includes(action.datasetId)
          ? project
          : appendAudit(
              { ...project, datasetIds: [...project.datasetIds, action.datasetId], updatedAt: action.now },
              auditEntry(action.now, "researcher", "Dataset added", action.datasetLabel),
            ),
      );

    case "remove-dataset":
      return withProject(state, action.projectId, (project) =>
        appendAudit(
          {
            ...project,
            datasetIds: project.datasetIds.filter((id) => id !== action.datasetId),
            application: {
              ...project.application,
              requestedVariables: project.application.requestedVariables.filter(
                (variable) => variable.datasetId !== action.datasetId,
              ),
            },
            updatedAt: action.now,
          },
          auditEntry(action.now, "researcher", "Dataset removed", action.datasetLabel),
        ),
      );

    case "update-application":
      return withProject(state, action.projectId, (project) => {
        const next: Project = {
          ...project,
          application: { ...project.application, ...action.patch },
          updatedAt: action.now,
        };
        return action.note
          ? appendAudit(next, auditEntry(action.now, "researcher", "Application updated", action.note))
          : next;
      });

    case "set-requested-variables":
      return withProject(state, action.projectId, (project) => ({
        ...project,
        application: { ...project.application, requestedVariables: action.variables },
        updatedAt: action.now,
      }));

    case "toggle-variable":
      return withProject(state, action.projectId, (project) => {
        const existing = project.application.requestedVariables.find(
          (variable) =>
            variable.datasetId === action.datasetId && variable.variableId === action.variableId,
        );
        const requestedVariables = existing
          ? project.application.requestedVariables.filter((variable) => variable !== existing)
          : [
              ...project.application.requestedVariables,
              {
                datasetId: action.datasetId,
                variableId: action.variableId,
                justification: "",
                granularity: "as-published" as const,
              },
            ];
        return appendAudit(
          {
            ...project,
            application: { ...project.application, requestedVariables },
            updatedAt: action.now,
          },
          auditEntry(
            action.now,
            "researcher",
            existing ? "Variable removed from request" : "Variable added to request",
            action.variableLabel,
          ),
        );
      });

    case "update-requested-variable":
      return withProject(state, action.projectId, (project) => ({
        ...project,
        application: {
          ...project.application,
          requestedVariables: project.application.requestedVariables.map((variable) =>
            variable.datasetId === action.datasetId && variable.variableId === action.variableId
              ? { ...variable, ...action.patch }
              : variable,
          ),
        },
        updatedAt: action.now,
      }));

    case "dismiss-recommendation":
      return withProject(state, action.projectId, (project) =>
        project.dismissedRecommendations.includes(action.recommendationId)
          ? project
          : appendAudit(
              {
                ...project,
                dismissedRecommendations: [...project.dismissedRecommendations, action.recommendationId],
                updatedAt: action.now,
              },
              auditEntry(
                action.now,
                "researcher",
                "Recommendation dismissed",
                `${action.recommendationId} — ${action.title}`,
              ),
            ),
      );

    case "restore-recommendation":
      return withProject(state, action.projectId, (project) => ({
        ...project,
        dismissedRecommendations: project.dismissedRecommendations.filter(
          (id) => id !== action.recommendationId,
        ),
        updatedAt: action.now,
      }));

    case "set-status":
      return withProject(state, action.projectId, (project) =>
        appendAudit(
          {
            ...project,
            status: action.status,
            updatedAt: action.now,
            submittedAt: action.status === "submitted" ? action.now : project.submittedAt,
            mockReference: action.reference ?? project.mockReference,
          },
          auditEntry(
            action.now,
            action.status === "approved" || action.status === "clarification-requested" ? "reviewer" : "researcher",
            "Status changed",
            `Status set to "${action.status}"${action.reference ? ` (mock reference ${action.reference})` : ""}`,
          ),
        ),
      );

    case "add-reviewer-note":
      return withProject(state, action.projectId, (project) =>
        appendAudit(
          {
            ...project,
            reviewerNotes: [...project.reviewerNotes, action.note],
            updatedAt: action.note.timestamp,
          },
          auditEntry(action.note.timestamp, "reviewer", "Reviewer note added", `${action.note.section}: ${action.note.decision}`),
        ),
      );

    case "reset-workspace":
      return initialWorkspace();

    default:
      return state;
  }
}
