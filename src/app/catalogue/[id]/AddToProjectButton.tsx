"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/store/WorkspaceProvider";
import { Button } from "@/components/ui/primitives";

/**
 * Adds or removes this dataset from the active project.
 *
 * Rendered as a client island inside an otherwise static profile page, so the
 * dataset content stays server-rendered and cacheable.
 */
export function AddToProjectButton({ datasetId, label }: { datasetId: string; label: string }) {
  const { state, projects, dispatch, hydrated } = useWorkspace();
  const project = projects.find((candidate) => candidate.id === state.activeProjectId) ?? projects[0];

  if (!hydrated) {
    return <div className="h-9 w-40 animate-pulse rounded bg-ink-100" aria-hidden="true" />;
  }

  if (!project) {
    return (
      <Link href="/projects" className="text-sm font-medium text-cyan-800 hover:underline">
        Create a project to add datasets →
      </Link>
    );
  }

  const inProject = project.datasetIds.includes(datasetId);

  return (
    <div className="text-right">
      <Button
        variant={inProject ? "secondary" : "primary"}
        onClick={() =>
          dispatch(
            inProject
              ? {
                  type: "remove-dataset",
                  projectId: project.id,
                  datasetId,
                  datasetLabel: label,
                  now: new Date().toISOString(),
                }
              : {
                  type: "add-dataset",
                  projectId: project.id,
                  datasetId,
                  datasetLabel: label,
                  now: new Date().toISOString(),
                },
          )
        }
      >
        {inProject ? "Remove from project" : "Add to project"}
      </Button>
      <p className="mt-1.5 text-xs text-ink-500">
        {inProject ? "In" : "Adds to"}{" "}
        <Link href={`/projects/${project.id}`} className="font-medium text-cyan-800 hover:underline">
          {project.title}
        </Link>
      </p>
    </div>
  );
}
