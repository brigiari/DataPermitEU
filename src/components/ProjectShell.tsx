"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store/WorkspaceProvider";
import { ProjectNav } from "@/components/ProjectNav";
import { EmptyState } from "@/components/ui/primitives";
import type { Project, Recommendation } from "@/lib/types";
import type { Dataset } from "@/lib/types";

interface ShellRenderProps {
  project: Project;
  datasets: Dataset[];
  findings: Recommendation[];
  dispatch: ReturnType<typeof useProject>["dispatch"];
  role: ReturnType<typeof useProject>["role"];
}

/**
 * Loads a project by id and hands it to the page.
 *
 * Centralising the not-found and not-yet-hydrated states here keeps every
 * project page free of that boilerplate, and guarantees they all handle a
 * deleted project the same way.
 */
export function ProjectShell({
  projectId,
  children,
}: {
  projectId: string;
  children: (props: ShellRenderProps) => ReactNode;
}) {
  const { project, datasets, findings, dispatch, role, hydrated } = useProject(projectId);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="h-8 w-2/3 animate-pulse rounded bg-ink-100" />
        <div className="mt-6 h-64 animate-pulse rounded-lg bg-ink-100" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Project not found"
          description="This project does not exist in this browser. It may have been deleted, or the link may come from a different device — nothing is stored on a server."
          action={
            <Link href="/projects" className="text-sm font-medium text-cyan-800 hover:underline">
              Back to all projects →
            </Link>
          }
        />
      </div>
    );
  }

  const counts = {
    compatibility: findings.filter(
      (finding) =>
        finding.kind === "cross-dataset-compatibility" || finding.kind === "terminology-conflict",
    ).length,
    minimisation: findings.filter((finding) => finding.kind === "data-minimisation").length,
    readiness: findings.filter((finding) => finding.severity === "attention").length,
  };

  return (
    <>
      <ProjectNav project={project} counts={counts} />
      {children({ project, datasets, findings, dispatch, role })}
    </>
  );
}
