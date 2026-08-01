"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Project, Role } from "@/lib/types";
import { DATASETS, DATASETS_BY_ID } from "@/lib/data/datasets";
import { analyseProject } from "@/lib/recommendations";
import {
  initialWorkspace,
  loadWorkspace,
  saveWorkspace,
  type WorkspaceState,
} from "@/lib/store/persistence";
import { workspaceReducer, type WorkspaceAction } from "@/lib/store/reducer";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface WorkspaceContextValue {
  state: WorkspaceState;
  dispatch: (action: WorkspaceAction) => void;
  /** False until localStorage has been read, so the UI can avoid a flash of demo data. */
  hydrated: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  role: Role;
  projects: Project[];
  getProject: (id: string) => Project | undefined;
  /** Findings for a project, with dismissals already applied. */
  findingsFor: (id: string) => ReturnType<typeof analyseProject>;
  datasetsFor: (id: string) => typeof DATASETS;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const AUTOSAVE_DEBOUNCE_MS = 600;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, initialWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstSave = useRef(true);

  // Hydrate once on mount. Rendering the demo workspace first keeps the server
  // and client markup identical; the persisted state replaces it immediately.
  useEffect(() => {
    dispatch({ type: "hydrate", state: loadWorkspace() });
    setHydrated(true);
  }, []);

  // Debounced autosave. Every state change schedules a write; rapid typing
  // collapses into a single one.
  useEffect(() => {
    if (!hydrated) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    setSaveStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const ok = saveWorkspace(state);
      setSaveStatus(ok ? "saved" : "error");
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, hydrated]);

  const getProject = useCallback(
    (id: string) => state.projects.find((project) => project.id === id),
    [state.projects],
  );

  const datasetsFor = useCallback(
    (id: string) => {
      const project = state.projects.find((candidate) => candidate.id === id);
      if (!project) return [];
      return project.datasetIds
        .map((datasetId) => DATASETS_BY_ID[datasetId])
        .filter((dataset): dataset is (typeof DATASETS)[number] => Boolean(dataset));
    },
    [state.projects],
  );

  const findingsFor = useCallback(
    (id: string) => {
      const project = state.projects.find((candidate) => candidate.id === id);
      if (!project) return [];
      return analyseProject({
        project,
        datasets: datasetsFor(id),
        application: project.application,
        catalogue: DATASETS,
      });
    },
    [state.projects, datasetsFor],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      state,
      dispatch,
      hydrated,
      saveStatus,
      lastSavedAt: state.lastSavedAt,
      role: state.role,
      projects: state.projects,
      getProject,
      findingsFor,
      datasetsFor,
    }),
    [state, hydrated, saveStatus, getProject, findingsFor, datasetsFor],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside a WorkspaceProvider");
  return context;
}

/** Convenience hook for a single project plus its derived data. */
export function useProject(projectId: string) {
  const { getProject, findingsFor, datasetsFor, dispatch, role, hydrated } = useWorkspace();
  const project = getProject(projectId);
  return useMemo(
    () => ({
      project,
      datasets: datasetsFor(projectId),
      findings: findingsFor(projectId),
      dispatch,
      role,
      hydrated,
    }),
    [project, projectId, datasetsFor, findingsFor, dispatch, role, hydrated],
  );
}
