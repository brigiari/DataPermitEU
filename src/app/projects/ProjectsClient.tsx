"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/store/WorkspaceProvider";
import { DATASETS_BY_ID } from "@/lib/data/datasets";
import { buildReadinessReport } from "@/lib/readiness";
import {
  Badge,
  Button,
  Card,
  Callout,
  EmptyState,
  SectionHeading,
  cx,
} from "@/components/ui/primitives";
import { STATUS_LABELS, StatusBadge } from "@/components/StatusBadge";

function slugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "project"
  );
}

export function ProjectsClient() {
  const { projects, dispatch, findingsFor, datasetsFor, hydrated, state } = useWorkspace();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length < 3) {
      setError("Give the project a title of at least three characters.");
      return;
    }
    if (question.trim().length < 15) {
      setError(
        "Write a research question of at least fifteen characters — relevance scoring and the minimisation review both read from it.",
      );
      return;
    }
    const id = `${slugFromTitle(title)}-${Date.now().toString(36)}`;
    dispatch({
      type: "create-project",
      id,
      title: title.trim(),
      researchQuestion: question.trim(),
      now: new Date().toISOString(),
    });
    setTitle("");
    setQuestion("");
    setError(null);
    setCreating(false);
    router.push(`/projects/${id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SectionHeading
        eyebrow="Workspace"
        title="Research projects"
        description="A project holds one research question, the datasets selected against it, a draft application, and an append-only audit trail. Everything is stored in this browser only."
        actions={
          <Button variant="primary" onClick={() => setCreating((value) => !value)} aria-expanded={creating}>
            {creating ? "Cancel" : "New project"}
          </Button>
        }
      />

      {creating ? (
        <Card className="mb-6 animate-fade-in">
          <form onSubmit={createProject} noValidate>
            <h2 className="text-base font-semibold">Create a project</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="new-title" className="label">
                  Project title
                </label>
                <input
                  id="new-title"
                  className="input mt-1"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Antibiotic prescribing and hospital-acquired infection"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-question" className="label">
                  Research question
                </label>
                <p className="hint mb-1 mt-0.5">
                  Write it as you would to a colleague. The relevance rules read this text directly,
                  so specific clinical and record-type terms produce better suggestions than abstract
                  phrasing.
                </p>
                <textarea
                  id="new-question"
                  className="input mt-1 min-h-[6rem]"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="e.g. Does early antibiotic de-escalation in intensive care reduce the incidence of hospital-acquired infection without increasing mortality?"
                  required
                />
              </div>
              {error ? (
                <p role="alert" className="text-sm font-medium text-rose-700">
                  {error}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  Create project
                </Button>
                <Button type="button" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}

      {!hydrated ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((index) => (
            <div key={index} className="h-40 animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project to start searching the catalogue against a research question."
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              New project
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => {
            const datasets = datasetsFor(project.id);
            const findings = findingsFor(project.id);
            const readiness = buildReadinessReport(project, datasets, findings);
            const attention = findings.filter((finding) => finding.severity === "attention").length;
            const isActive = state.activeProjectId === project.id;

            return (
              <li key={project.id}>
                <Card className={cx(isActive && "ring-1 ring-cyan-400")}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={project.status} />
                        {isActive ? <Badge tone="cyan">Active</Badge> : null}
                        {project.mockReference ? (
                          <span className="font-mono text-xs text-ink-500">{project.mockReference}</span>
                        ) : null}
                      </div>
                      <h2 className="text-lg font-semibold">
                        <Link href={`/projects/${project.id}`} className="hover:text-cyan-800 hover:underline">
                          {project.title}
                        </Link>
                      </h2>
                      <p className="prose-body mt-1.5 max-w-3xl">{project.researchQuestion}</p>
                      {project.principalInvestigator ? (
                        <p className="mt-2 text-xs text-ink-500">
                          {project.principalInvestigator}
                          {project.institution ? ` · ${project.institution}` : ""}
                        </p>
                      ) : null}
                    </div>

                    <div className="w-full shrink-0 sm:w-56">
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-xs font-medium text-ink-600">Readiness</span>
                        <span className="font-mono text-xs tabular-nums text-ink-700">
                          {readiness.overall}/100
                        </span>
                      </div>
                      <div
                        role="meter"
                        aria-valuenow={readiness.overall}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Application completeness for ${project.title}`}
                        className="h-2 w-full overflow-hidden rounded-full bg-ink-100"
                      >
                        <div
                          className={cx(
                            "h-full rounded-full",
                            readiness.overall >= 80
                              ? "bg-emerald-500"
                              : readiness.overall >= 50
                                ? "bg-cyan-500"
                                : "bg-gold-400",
                          )}
                          style={{ width: `${readiness.overall}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-ink-500">{readiness.band}</p>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { term: "Datasets", value: String(datasets.length) },
                      {
                        term: "Variables requested",
                        value: String(project.application.requestedVariables.length),
                      },
                      { term: "Open findings", value: String(findings.length) },
                      { term: "Needs attention", value: String(attention) },
                    ].map((item) => (
                      <div key={item.term} className="surface-muted px-3 py-2">
                        <dt className="text-[0.6875rem] uppercase tracking-wide text-ink-500">
                          {item.term}
                        </dt>
                        <dd className="text-lg font-semibold tabular-nums text-ink-900">{item.value}</dd>
                      </div>
                    ))}
                  </dl>

                  {datasets.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {datasets.map((dataset) => (
                        <Badge key={dataset.id} tone="neutral">
                          {dataset.acronym} · {dataset.country}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-sm font-medium text-cyan-800 hover:underline"
                    >
                      Open workspace <span aria-hidden="true">→</span>
                    </Link>
                    {!isActive ? (
                      <Button
                        variant="ghost"
                        onClick={() => dispatch({ type: "set-active-project", projectId: project.id })}
                      >
                        Make active
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      className="ml-auto"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete "${project.title}"? This removes it from this browser and cannot be undone.`,
                          )
                        ) {
                          dispatch({ type: "delete-project", projectId: project.id });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Callout tone="info" title="Where this data lives">
          Projects are stored in this browser&apos;s local storage under a single key. Nothing is sent
          anywhere — there is no server, no account and no analytics. Clearing site data removes
          everything and restores the demo projects.
        </Callout>
        <Callout tone="trust" title="Statuses are simulated">
          {Object.values(STATUS_LABELS).join(", ")} are mock states you set yourself. No application
          is ever transmitted, and nothing here corresponds to a real submission or decision.
        </Callout>
      </div>
    </div>
  );
}
