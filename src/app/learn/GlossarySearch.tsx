"use client";

import { useMemo, useState } from "react";
import type { GlossaryEntry } from "@/lib/data/learning";
import { Badge, Button, Card, cx } from "@/components/ui/primitives";

type Filter = "all" | "real-concept" | "prototype-invention";

export function GlossarySearch({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries
      .filter((entry) => (filter === "all" ? true : entry.provenance === filter))
      .filter(
        (entry) =>
          needle.length === 0 ||
          entry.term.toLowerCase().includes(needle) ||
          entry.definition.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [entries, query, filter]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="glossary-search" className="label mb-1">
            Search the glossary
          </label>
          <input
            id="glossary-search"
            type="search"
            className="input"
            placeholder="e.g. pseudonymisation, output checking"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div
          className="flex rounded-md border border-ink-300 bg-white p-0.5"
          role="group"
          aria-label="Filter glossary by provenance"
        >
          {(
            [
              { value: "all", label: "All" },
              { value: "real-concept", label: "Real concepts" },
              { value: "prototype-invention", label: "Prototype inventions" },
            ] as { value: Filter; label: string }[]
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cx(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                filter === option.value
                  ? "bg-ink-800 text-parchment-50"
                  : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="mb-3 text-sm text-ink-600">
        {results.length} term{results.length === 1 ? "" : "s"}
      </p>

      {results.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-600">
            No glossary term matches that search.{" "}
            <Button variant="ghost" onClick={() => { setQuery(""); setFilter("all"); }}>
              Clear
            </Button>
          </p>
        </Card>
      ) : (
        <dl className="space-y-3">
          {results.map((entry) => (
            <div key={entry.term} className="surface p-5">
              <dt className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-ink-900">{entry.term}</span>
                <Badge tone={entry.provenance === "prototype-invention" ? "gold" : "cyan"}>
                  {entry.provenance === "prototype-invention"
                    ? "Invented for this prototype"
                    : "Real concept"}
                </Badge>
              </dt>
              <dd className="prose-body mt-2">
                {entry.definition}
                {entry.seeAlso && entry.seeAlso.length > 0 ? (
                  <span className="mt-2 block text-sm text-ink-500">
                    See also: {entry.seeAlso.join(", ")}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
