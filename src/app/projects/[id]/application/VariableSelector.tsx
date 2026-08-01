"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dataset, Project, RequestedVariable } from "@/lib/types";
import type { WorkspaceAction } from "@/lib/store/reducer";
import { Badge, Button, Card, cx } from "@/components/ui/primitives";
import { wordCount } from "@/lib/text";

const SENSITIVITY_TONE = {
  low: "neutral",
  moderate: "cyan",
  high: "caution",
  "direct-identifier": "critical",
} as const;

const GRANULARITY_OPTIONS: { value: RequestedVariable["granularity"]; label: string }[] = [
  { value: "as-published", label: "As published — full detail" },
  { value: "coarsened", label: "Coarsened — reduced detail" },
  { value: "derived-indicator", label: "Derived indicator only" },
];

/**
 * Per-variable request builder.
 *
 * The design decision worth noting: a justification field sits directly next to
 * every selected variable, rather than one free-text box covering the whole
 * request. Minimisation only becomes reviewable when the argument is made field
 * by field, and putting the box there is what makes people write it.
 */
export function VariableSelector({
  project,
  datasets,
  dispatch,
}: {
  project: Project;
  datasets: Dataset[];
  dispatch: (action: WorkspaceAction) => void;
}) {
  const [openDataset, setOpenDataset] = useState<string | null>(datasets[0]?.id ?? null);
  const requested = project.application.requestedVariables;
  const now = () => new Date().toISOString();

  function isRequested(datasetId: string, variableId: string) {
    return requested.some(
      (variable) => variable.datasetId === datasetId && variable.variableId === variableId,
    );
  }

  function requestFor(datasetId: string, variableId: string) {
    return requested.find(
      (variable) => variable.datasetId === datasetId && variable.variableId === variableId,
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Requested variables</h2>
          <p className="prose-body mt-1.5 max-w-2xl">
            Select only the variables your analysis plan consumes, and record why each one is needed.
            The justification is what a reviewer reads when assessing necessity — an unexplained
            variable is the most common reason a request is trimmed.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums text-ink-900">{requested.length}</p>
          <p className="text-xs text-ink-500">
            of {datasets.reduce((total, dataset) => total + dataset.variables.length, 0)} available
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {datasets.map((dataset) => {
          const open = openDataset === dataset.id;
          const count = requested.filter((variable) => variable.datasetId === dataset.id).length;
          return (
            <div key={dataset.id} className="rounded-lg border border-ink-200">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenDataset(open ? null : dataset.id)}
                  aria-expanded={open}
                  aria-controls={`variables-${dataset.id}`}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink-900">
                      {dataset.acronym}{" "}
                      <span className="font-normal text-ink-500">— {dataset.name}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">
                      {dataset.country} · {dataset.variables.length} variables ·{" "}
                      {count === 0 ? (
                        <span className="text-amber-700">none requested</span>
                      ) : (
                        `${count} requested`
                      )}
                    </span>
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className={cx(
                      "h-4 w-4 shrink-0 text-ink-500 transition-transform",
                      open && "rotate-180",
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </h3>

              <div id={`variables-${dataset.id}`} hidden={!open} className="border-t border-ink-100">
                <ul className="divide-y divide-ink-100">
                  {dataset.variables.map((variable) => {
                    const selected = isRequested(dataset.id, variable.id);
                    const request = requestFor(dataset.id, variable.id);
                    const thin =
                      selected &&
                      (variable.sensitivity === "high" || variable.sensitivity === "direct-identifier") &&
                      wordCount(request?.justification ?? "") < 6;

                    return (
                      <li
                        key={variable.id}
                        className={cx("px-4 py-3", selected && "bg-cyan-50/40")}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id={`var-${dataset.id}-${variable.id}`}
                            checked={selected}
                            onChange={() =>
                              dispatch({
                                type: "toggle-variable",
                                projectId: project.id,
                                datasetId: dataset.id,
                                variableId: variable.id,
                                variableLabel: `${variable.name} (${dataset.acronym})`,
                                now: now(),
                              })
                            }
                            className="mt-1 h-4 w-4 shrink-0 rounded border-ink-400 text-cyan-700 focus:ring-cyan-600"
                          />
                          <div className="min-w-0 flex-1">
                            <label
                              htmlFor={`var-${dataset.id}-${variable.id}`}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <span className="text-sm font-medium text-ink-900">{variable.name}</span>
                              <Badge tone={SENSITIVITY_TONE[variable.sensitivity]}>
                                {variable.sensitivity}
                              </Badge>
                              <span className="text-xs capitalize text-ink-500">
                                {variable.category}
                              </span>
                              <span className="font-mono text-xs text-ink-400">
                                {variable.completeness.toFixed(1)}% complete
                              </span>
                            </label>
                            <p className="mt-0.5 text-xs leading-relaxed text-ink-600">
                              {variable.description}
                            </p>
                            {variable.defaultGranularity ? (
                              <p className="mt-1 text-xs text-gold-700">
                                Holder default: {variable.defaultGranularity}
                              </p>
                            ) : null}

                            {selected && request ? (
                              <div className="mt-3 space-y-3 rounded border border-cyan-200 bg-white p-3">
                                <div>
                                  <label
                                    htmlFor={`just-${dataset.id}-${variable.id}`}
                                    className="text-xs font-medium text-ink-700"
                                  >
                                    Why this variable is necessary
                                    {thin ? (
                                      <span className="ml-2 font-normal text-amber-700">
                                        A specific justification is expected for {variable.sensitivity}{" "}
                                        sensitivity
                                      </span>
                                    ) : null}
                                  </label>
                                  <textarea
                                    id={`just-${dataset.id}-${variable.id}`}
                                    rows={2}
                                    className={cx("input mt-1 text-sm", thin && "border-amber-400")}
                                    value={request.justification}
                                    placeholder="Which analysis step needs this, and what would be lost without it?"
                                    onChange={(event) =>
                                      dispatch({
                                        type: "update-requested-variable",
                                        projectId: project.id,
                                        datasetId: dataset.id,
                                        variableId: variable.id,
                                        patch: { justification: event.target.value },
                                        now: now(),
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`gran-${dataset.id}-${variable.id}`}
                                    className="text-xs font-medium text-ink-700"
                                  >
                                    Requested granularity
                                  </label>
                                  <select
                                    id={`gran-${dataset.id}-${variable.id}`}
                                    className="input mt-1 py-1.5 text-sm"
                                    value={request.granularity}
                                    onChange={(event) =>
                                      dispatch({
                                        type: "update-requested-variable",
                                        projectId: project.id,
                                        datasetId: dataset.id,
                                        variableId: variable.id,
                                        patch: {
                                          granularity: event.target
                                            .value as RequestedVariable["granularity"],
                                        },
                                        now: now(),
                                      })
                                    }
                                  >
                                    {GRANULARITY_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 px-4 py-3">
                  <Link
                    href={`/catalogue/${dataset.id}`}
                    className="text-xs font-medium text-cyan-800 hover:underline"
                  >
                    Open the full dataset profile →
                  </Link>
                  {count > 0 ? (
                    <Button
                      variant="ghost"
                      className="ml-auto text-xs"
                      onClick={() =>
                        dispatch({
                          type: "set-requested-variables",
                          projectId: project.id,
                          variables: project.application.requestedVariables.filter(
                            (variable) => variable.datasetId !== dataset.id,
                          ),
                          now: now(),
                        })
                      }
                    >
                      Clear all from {dataset.acronym}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
