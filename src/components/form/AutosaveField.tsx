"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cx } from "@/components/ui/primitives";
import { wordCount } from "@/lib/text";

const DEBOUNCE_MS = 400;

/**
 * A text field that commits to the store on a debounce.
 *
 * Local state keeps typing smooth; the debounced commit means the reducer (and
 * therefore the recommendation engine, which recomputes on every state change)
 * runs at a sensible cadence rather than on every keystroke. Blur commits
 * immediately so a user who tabs away never loses the last word.
 */
export function AutosaveTextarea({
  label,
  value,
  onCommit,
  hint,
  placeholder,
  rows = 4,
  guideWords,
  required,
}: {
  label: string;
  value: string;
  onCommit: (next: string) => void;
  hint?: string;
  placeholder?: string;
  rows?: number;
  guideWords?: number;
  required?: boolean;
}) {
  const id = useId();
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committed = useRef(value);

  // Adopt external changes (e.g. loading a different project) without
  // clobbering in-flight typing.
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setLocal(value);
    }
  }, [value]);

  function schedule(next: string) {
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      committed.current = next;
      onCommit(next);
    }, DEBOUNCE_MS);
  }

  function commitNow() {
    if (timer.current) clearTimeout(timer.current);
    if (local !== committed.current) {
      committed.current = local;
      onCommit(local);
    }
  }

  const words = wordCount(local);
  const meetsGuide = guideWords === undefined || words >= guideWords;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="label">
          {label}
          {required ? (
            <span className="ml-1 text-rose-700" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {guideWords !== undefined ? (
          <span
            className={cx("text-xs tabular-nums", meetsGuide ? "text-ink-500" : "text-amber-700")}
          >
            {words} / {guideWords} words suggested
          </span>
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="hint mb-1.5 mt-0.5">
          {hint}
        </p>
      ) : null}
      <textarea
        id={id}
        rows={rows}
        className="input"
        value={local}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-required={required}
        onChange={(event) => schedule(event.target.value)}
        onBlur={commitNow}
      />
    </div>
  );
}

export function AutosaveInput({
  label,
  value,
  onCommit,
  hint,
  placeholder,
  type = "text",
  required,
  min,
  max,
}: {
  label: string;
  value: string | number;
  onCommit: (next: string) => void;
  hint?: string;
  placeholder?: string;
  type?: "text" | "number" | "date";
  required?: boolean;
  min?: number | string;
  max?: number | string;
}) {
  const id = useId();
  const [local, setLocal] = useState(String(value ?? ""));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committed = useRef(String(value ?? ""));

  useEffect(() => {
    const next = String(value ?? "");
    if (next !== committed.current) {
      committed.current = next;
      setLocal(next);
    }
  }, [value]);

  function schedule(next: string) {
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      committed.current = next;
      onCommit(next);
    }, DEBOUNCE_MS);
  }

  function commitNow() {
    if (timer.current) clearTimeout(timer.current);
    if (local !== committed.current) {
      committed.current = local;
      onCommit(local);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? (
          <span className="ml-1 text-rose-700" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="hint mb-1.5 mt-0.5">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        className="input mt-1"
        value={local}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-required={required}
        onChange={(event) => schedule(event.target.value)}
        onBlur={commitNow}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
  required,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required ? (
          <span className="ml-1 text-rose-700" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="hint mb-1.5 mt-0.5">
          {hint}
        </p>
      ) : null}
      <select
        id={id}
        className="input mt-1"
        value={value}
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={description ? `${id}-description` : undefined}
        className="mt-1 h-4 w-4 shrink-0 rounded border-ink-400 text-cyan-700 focus:ring-cyan-600"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink-800">
          {label}
        </label>
        {description ? (
          <p id={`${id}-description`} className="mt-0.5 text-sm text-ink-600">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
