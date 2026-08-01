"use client";

import { useMemo, useState } from "react";
import type { Dataset, DatasetVariable } from "@/lib/types";
import { Badge, cx } from "@/components/ui/primitives";

const SENSITIVITY_TONE = {
  low: "neutral",
  moderate: "cyan",
  high: "caution",
  "direct-identifier": "critical",
} as const;

const SENSITIVITY_ORDER: DatasetVariable["sensitivity"][] = [
  "direct-identifier",
  "high",
  "moderate",
  "low",
];

type SortKey = "name" | "category" | "sensitivity" | "completeness";

/**
 * The variable table.
 *
 * Sorting is client-side and the completeness bar is decorative — the number
 * is always present as text, so the visualisation adds emphasis rather than
 * carrying information on its own.
 */
export function VariableTable({ dataset }: { dataset: Dataset }) {
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "sensitivity",
    direction: "asc",
  });
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? dataset.variables.filter(
          (variable) =>
            variable.name.toLowerCase().includes(needle) ||
            variable.description.toLowerCase().includes(needle) ||
            variable.category.includes(needle),
        )
      : dataset.variables;

    const sorted = [...filtered].sort((a, b) => {
      const direction = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "completeness":
          return (a.completeness - b.completeness) * direction;
        case "category":
          return a.category.localeCompare(b.category) * direction;
        case "sensitivity":
          return (
            (SENSITIVITY_ORDER.indexOf(a.sensitivity) - SENSITIVITY_ORDER.indexOf(b.sensitivity)) *
            direction
          );
        default:
          return a.name.localeCompare(b.name) * direction;
      }
    });
    return sorted;
  }, [dataset.variables, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
    if (sort.key !== key) return "none";
    return sort.direction === "asc" ? "ascending" : "descending";
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label htmlFor={`variable-filter-${dataset.id}`} className="sr-only">
          Filter variables
        </label>
        <input
          id={`variable-filter-${dataset.id}`}
          type="search"
          placeholder="Filter variables…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="input max-w-xs py-1.5 text-sm"
        />
        <p className="text-sm text-ink-500" aria-live="polite">
          {rows.length} of {dataset.variables.length} variables
        </p>
      </div>

      <div className="table-scroll">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Variables available in {dataset.name}, with category, sensitivity band, coding system and
            field completeness.
          </caption>
          <thead>
            <tr className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              {(
                [
                  { key: "name" as const, label: "Variable" },
                  { key: "category" as const, label: "Category" },
                  { key: "sensitivity" as const, label: "Sensitivity" },
                  { key: "completeness" as const, label: "Completeness" },
                ] satisfies { key: SortKey; label: string }[]
              ).map((column) => (
                <th key={column.key} scope="col" aria-sort={ariaSort(column.key)} className="py-2 pr-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="inline-flex items-center gap-1 hover:text-ink-800"
                  >
                    {column.label}
                    <span aria-hidden="true" className={cx("text-[0.625rem]", sort.key !== column.key && "opacity-30")}>
                      {sort.key === column.key && sort.direction === "desc" ? "▼" : "▲"}
                    </span>
                  </button>
                </th>
              ))}
              <th scope="col" className="py-2 font-semibold">
                Coding
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((variable) => (
              <tr key={variable.id} className="border-b border-ink-100 align-top">
                <th scope="row" className="max-w-sm py-3 pr-4 font-normal">
                  <span className="block font-medium text-ink-900">{variable.name}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-600">
                    {variable.description}
                  </span>
                  {variable.defaultGranularity ? (
                    <span className="mt-1 block text-xs text-gold-700">
                      Default release: {variable.defaultGranularity}
                    </span>
                  ) : null}
                </th>
                <td className="py-3 pr-4 text-xs capitalize text-ink-600">{variable.category}</td>
                <td className="py-3 pr-4">
                  <Badge tone={SENSITIVITY_TONE[variable.sensitivity]}>{variable.sensitivity}</Badge>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-ink-700">
                      {variable.completeness.toFixed(1)}%
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100"
                    >
                      <span
                        className={cx(
                          "block h-full rounded-full",
                          variable.completeness >= 90
                            ? "bg-cyan-600"
                            : variable.completeness >= 70
                              ? "bg-cyan-400"
                              : "bg-gold-400",
                        )}
                        style={{ width: `${variable.completeness}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="py-3 text-xs text-ink-600">{variable.codingSystem ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-600">No variables match that filter.</p>
      ) : null}
    </div>
  );
}
