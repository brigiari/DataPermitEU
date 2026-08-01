"use client";

import { useId, useState } from "react";
import { cx } from "@/components/ui/primitives";

/**
 * A collapsible checkbox facet.
 *
 * Counts are computed against the results of all *other* facets, so a value
 * showing "0" genuinely cannot add anything to the current selection. Zero-count
 * options stay visible but disabled rather than disappearing, which keeps the
 * list from jumping around as the user refines.
 */
export function FacetGroup<T extends string>({
  legend,
  options,
  selected,
  counts,
  onChange,
  defaultOpen = false,
  description,
}: {
  legend: string;
  options: readonly T[];
  selected: T[];
  counts?: Record<string, number>;
  onChange: (next: T[]) => void;
  defaultOpen?: boolean;
  description?: string;
}) {
  const [open, setOpen] = useState(defaultOpen || selected.length > 0);
  const id = useId();

  function toggle(option: T) {
    onChange(selected.includes(option) ? selected.filter((value) => value !== option) : [...selected, option]);
  }

  return (
    <div className="border-b border-ink-200 py-3 last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-sm font-semibold text-ink-800">
            {legend}
            {selected.length > 0 ? (
              <span className="ml-2 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[0.6875rem] font-medium text-cyan-900">
                {selected.length}
              </span>
            ) : null}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={cx("h-4 w-4 shrink-0 text-ink-500 transition-transform", open && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h3>

      <div id={id} hidden={!open} className="mt-2">
        {description ? <p className="mb-2 text-xs text-ink-500">{description}</p> : null}
        <ul className="space-y-1">
          {options.map((option) => {
            const count = counts?.[option];
            const disabled = count === 0 && !selected.includes(option);
            return (
              <li key={option}>
                <label
                  className={cx(
                    "flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm",
                    disabled ? "cursor-not-allowed text-ink-400" : "text-ink-700 hover:bg-ink-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    disabled={disabled}
                    onChange={() => toggle(option)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-400 text-cyan-700 focus:ring-cyan-600"
                  />
                  <span className="flex-1">{option}</span>
                  {count !== undefined ? (
                    <span className="font-mono text-xs tabular-nums text-ink-400">{count}</span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Numeric threshold facet rendered as a labelled range input. */
export function RangeFacet({
  legend,
  value,
  onChange,
  min,
  max,
  step = 5,
  unit = "",
  description,
}: {
  legend: string;
  value: number | null;
  onChange: (next: number | null) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="border-b border-ink-200 py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink-800">
          {legend}
        </label>
        <span className="font-mono text-xs tabular-nums text-ink-600">
          {value === null ? "Any" : `≥ ${value}${unit}`}
        </span>
      </div>
      {description ? <p className="mt-1 text-xs text-ink-500">{description}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange(next === min ? null : next);
          }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded bg-ink-200 accent-cyan-600"
        />
        {value !== null ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-xs font-medium text-ink-500 underline underline-offset-2 hover:text-ink-800"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
