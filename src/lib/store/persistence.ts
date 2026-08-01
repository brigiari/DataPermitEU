import type { Project, Role } from "@/lib/types";
import { DEMO_PROJECTS } from "@/lib/data/demo";

export const STORAGE_KEY = "datapermit-eu:workspace:v1";

export interface WorkspaceState {
  version: 1;
  projects: Project[];
  activeProjectId: string | null;
  role: Role;
  /** ISO timestamp of the last successful write. */
  lastSavedAt: string | null;
}

export function initialWorkspace(): WorkspaceState {
  return {
    version: 1,
    projects: DEMO_PROJECTS.map((project) => structuredClone(project)),
    activeProjectId: DEMO_PROJECTS[0]?.id ?? null,
    role: "researcher",
    lastSavedAt: null,
  };
}

/**
 * Reads persisted state.
 *
 * All demo state lives in this browser's localStorage. Nothing is transmitted
 * anywhere: the prototype has no backend, no analytics and no third-party
 * requests, which is a deliberate choice for something that models a
 * privacy-sensitive workflow.
 */
export function loadWorkspace(): WorkspaceState {
  if (typeof window === "undefined") return initialWorkspace();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialWorkspace();
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.projects)) return initialWorkspace();
    return {
      version: 1,
      projects: parsed.projects as Project[],
      activeProjectId: parsed.activeProjectId ?? parsed.projects[0]?.id ?? null,
      role: parsed.role === "reviewer" ? "reviewer" : "researcher",
      lastSavedAt: parsed.lastSavedAt ?? null,
    };
  } catch {
    // A corrupted or partially written entry should never brick the app.
    return initialWorkspace();
  }
}

export function saveWorkspace(state: WorkspaceState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearWorkspace(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
