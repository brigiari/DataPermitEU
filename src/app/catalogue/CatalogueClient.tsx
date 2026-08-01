"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ACCESS_COMPLEXITIES,
  CODING_SYSTEMS,
  COUNTRIES,
  DATA_CATEGORIES,
  DISEASE_AREAS,
  LINKAGE_STATUSES,
  POPULATIONS,
  UPDATE_FREQUENCIES,
} from "@/lib/types";
import { DATASETS } from "@/lib/data/datasets";
import { ACCESS_BODY_LIST } from "@/lib/data/access-bodies";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  facetCounts,
  filterDatasets,
  type CatalogueFilters,
} from "@/lib/search";
import { rankDatasets } from "@/lib/recommendations/relevance";
import { useWorkspace } from "@/lib/store/WorkspaceProvider";
import { DatasetCard } from "@/components/DatasetCard";
import { FacetGroup, RangeFacet } from "@/components/catalogue/FacetGroup";
import { Badge, Button, Card, EmptyState, cx } from "@/components/ui/primitives";

export function CatalogueClient() {
  const [filters, setFilters] = useState<CatalogueFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const { state, projects, dispatch, hydrated } = useWorkspace();

  const activeProject = projects.find((project) => project.id === state.activeProjectId) ?? projects[0];

  // Deferring the query keeps typing responsive while the (synchronous) filter
  // pass runs. The catalogue is small, but the pattern is the right one.
  const deferredFilters = useDeferredValue(filters);

  const results = useMemo(() => filterDatasets(DATASETS, deferredFilters), [deferredFilters]);

  const relevance = useMemo(() => {
    if (!activeProject?.researchQuestion) return new Map<string, ReturnType<typeof rankDatasets>[number]>();
    return new Map(rankDatasets(DATASETS, activeProject.researchQuestion).map((score) => [score.datasetId, score]));
  }, [activeProject?.researchQuestion]);

  const counts = useMemo(
    () => ({
      countries: facetCounts(DATASETS, deferredFilters, "countries", COUNTRIES, (d) => [d.country]),
      diseaseAreas: facetCounts(DATASETS, deferredFilters, "diseaseAreas", DISEASE_AREAS, (d) => d.diseaseAreas),
      dataCategories: facetCounts(DATASETS, deferredFilters, "dataCategories", DATA_CATEGORIES, (d) => d.dataCategories),
      populations: facetCounts(DATASETS, deferredFilters, "populations", POPULATIONS, (d) => d.populations),
      updateFrequencies: facetCounts(DATASETS, deferredFilters, "updateFrequencies", UPDATE_FREQUENCIES, (d) => [d.updateFrequency]),
      codingSystems: facetCounts(DATASETS, deferredFilters, "codingSystems", CODING_SYSTEMS, (d) => d.codingSystems),
      accessBodies: facetCounts(DATASETS, deferredFilters, "accessBodies", ACCESS_BODY_LIST.map((body) => body.id), (d) => [d.accessBody.id]),
      accessComplexities: facetCounts(DATASETS, deferredFilters, "accessComplexities", ACCESS_COMPLEXITIES, (d) => [d.accessComplexity]),
      linkageStatuses: facetCounts(DATASETS, deferredFilters, "linkageStatuses", LINKAGE_STATUSES, (d) => [d.linkage.status]),
    }),
    [deferredFilters],
  );

  const active = activeFilterCount(filters);
  const now = () => new Date().toISOString();

  function update<K extends keyof CatalogueFilters>(key: K, value: CatalogueFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const accessBodyLabels = useMemo(
    () => Object.fromEntries(ACCESS_BODY_LIST.map((body) => [body.id, `${body.name} (${body.country})`])),
    [],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="eyebrow mb-1.5">Dataset discovery</p>
        <h1 className="text-2xl sm:text-3xl">Catalogue</h1>
        <p className="prose-body mt-2 max-w-3xl">
          {DATASETS.length} fictional datasets across {new Set(DATASETS.map((d) => d.country)).size}{" "}
          European countries. Filtering runs entirely in your browser — every facet is applied
          synchronously against the in-memory catalogue, with counts computed against the results of
          all other facets so a zero never hides a live option.
        </p>
      </div>

      {/* Search bar ------------------------------------------------------- */}
      <div className="surface mb-5 p-4">
        <label htmlFor="catalogue-search" className="label mb-1.5">
          Search datasets, holders and variables
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="catalogue-search"
            type="search"
            className="input flex-1 min-w-[16rem]"
            placeholder="e.g. dispensing adherence readmission"
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
          />
          <Button
            variant="secondary"
            className="lg:hidden"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            aria-controls="facet-panel"
          >
            Filters {active > 0 ? `(${active})` : ""}
          </Button>
          {active > 0 ? (
            <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear all filters
            </Button>
          ) : null}
        </div>

        {hydrated && activeProject?.researchQuestion ? (
          <div className="mt-3 rounded border border-cyan-200 bg-cyan-50/60 p-3 text-sm">
            <p className="text-ink-800">
              <span className="font-medium">Relevance scoring is on</span>, using the research
              question from{" "}
              <Link href={`/projects/${activeProject.id}`} className="font-medium text-cyan-800 underline">
                {activeProject.title}
              </Link>
              . Scores come from the deterministic rule set and are a starting point for your own
              judgement, not a ranking to trust.
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        {/* Facets --------------------------------------------------------- */}
        <aside
          id="facet-panel"
          className={cx("lg:block", showFilters ? "block" : "hidden")}
          aria-label="Catalogue filters"
        >
          <Card className="lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
            <p className="mb-2 text-sm font-semibold text-ink-900">
              Filters{" "}
              {active > 0 ? <span className="font-normal text-ink-500">({active} active)</span> : null}
            </p>

            <FacetGroup
              legend="Country"
              options={COUNTRIES}
              selected={filters.countries}
              counts={counts.countries}
              onChange={(next) => update("countries", next)}
              defaultOpen
            />
            <FacetGroup
              legend="Disease area"
              options={DISEASE_AREAS}
              selected={filters.diseaseAreas}
              counts={counts.diseaseAreas}
              onChange={(next) => update("diseaseAreas", next)}
              defaultOpen
            />
            <FacetGroup
              legend="Data category"
              options={DATA_CATEGORIES}
              selected={filters.dataCategories}
              counts={counts.dataCategories}
              onChange={(next) => update("dataCategories", next)}
            />
            <FacetGroup
              legend="Population"
              options={POPULATIONS}
              selected={filters.populations}
              counts={counts.populations}
              onChange={(next) => update("populations", next)}
            />
            <FacetGroup
              legend="Update frequency"
              options={UPDATE_FREQUENCIES}
              selected={filters.updateFrequencies}
              counts={counts.updateFrequencies}
              onChange={(next) => update("updateFrequencies", next)}
            />
            <FacetGroup
              legend="Coding system"
              options={CODING_SYSTEMS}
              selected={filters.codingSystems}
              counts={counts.codingSystems}
              onChange={(next) => update("codingSystems", next)}
              description="Terminologies the holder declares. Mismatches here drive the terminology-conflict findings."
            />
            <FacetGroup
              legend="Access-body jurisdiction"
              options={ACCESS_BODY_LIST.map((body) => body.id)}
              selected={filters.accessBodies}
              counts={counts.accessBodies}
              onChange={(next) => update("accessBodies", next)}
              description="Every body listed here is fictional."
            />
            <FacetGroup
              legend="Access complexity"
              options={ACCESS_COMPLEXITIES}
              selected={filters.accessComplexities}
              counts={counts.accessComplexities}
              onChange={(next) => update("accessComplexities", next)}
            />
            <FacetGroup
              legend="Linkage availability"
              options={LINKAGE_STATUSES}
              selected={filters.linkageStatuses}
              counts={counts.linkageStatuses}
              onChange={(next) => update("linkageStatuses", next)}
            />

            <div className="border-b border-ink-200 py-3">
              <p className="text-sm font-semibold text-ink-800">Time coverage</p>
              <p className="mt-1 text-xs text-ink-500">
                Shows datasets holding records within the years you set.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="coverage-from" className="block text-xs text-ink-600">
                    From
                  </label>
                  <input
                    id="coverage-from"
                    type="number"
                    min={1980}
                    max={2026}
                    placeholder="1980"
                    className="input mt-1 py-1 text-sm"
                    value={filters.coverageFrom ?? ""}
                    onChange={(event) =>
                      update("coverageFrom", event.target.value ? Number(event.target.value) : null)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="coverage-to" className="block text-xs text-ink-600">
                    To
                  </label>
                  <input
                    id="coverage-to"
                    type="number"
                    min={1980}
                    max={2026}
                    placeholder="2026"
                    className="input mt-1 py-1 text-sm"
                    value={filters.coverageTo ?? ""}
                    onChange={(event) =>
                      update("coverageTo", event.target.value ? Number(event.target.value) : null)
                    }
                  />
                </div>
              </div>
            </div>

            <RangeFacet
              legend="Minimum cohort size"
              value={filters.minCohortSize}
              onChange={(next) => update("minCohortSize", next)}
              min={0}
              max={5_000_000}
              step={100_000}
              description="Approximate number of people the fictional dataset covers."
            />
            <RangeFacet
              legend="Minimum completeness"
              value={filters.minCompleteness}
              onChange={(next) => update("minCompleteness", next)}
              min={0}
              max={100}
              unit="/100"
            />
            <RangeFacet
              legend="Minimum interoperability"
              value={filters.minInteroperability}
              onChange={(next) => update("minInteroperability", next)}
              min={0}
              max={100}
              unit="/100"
            />
            <RangeFacet
              legend="Minimum timeliness"
              value={filters.minTimeliness}
              onChange={(next) => update("minTimeliness", next)}
              min={0}
              max={100}
              unit="/100"
            />
          </Card>
        </aside>

        {/* Results -------------------------------------------------------- */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-ink-600">
              <span className="font-semibold text-ink-900">{results.length}</span> of {DATASETS.length}{" "}
              datasets
              {active > 0 ? " match the current filters" : ""}
            </p>
            {activeProject ? (
              <p className="text-xs text-ink-500">
                Adding to project: <span className="font-medium text-ink-700">{activeProject.title}</span>
              </p>
            ) : null}
          </div>

          {active > 0 ? (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {filters.countries.map((value) => (
                <FilterChip key={value} label={value} onRemove={() => update("countries", filters.countries.filter((v) => v !== value))} />
              ))}
              {filters.diseaseAreas.map((value) => (
                <FilterChip key={value} label={value} onRemove={() => update("diseaseAreas", filters.diseaseAreas.filter((v) => v !== value))} />
              ))}
              {filters.dataCategories.map((value) => (
                <FilterChip key={value} label={value} onRemove={() => update("dataCategories", filters.dataCategories.filter((v) => v !== value))} />
              ))}
              {filters.populations.map((value) => (
                <FilterChip key={value} label={value} onRemove={() => update("populations", filters.populations.filter((v) => v !== value))} />
              ))}
              {filters.codingSystems.map((value) => (
                <FilterChip key={value} label={value} onRemove={() => update("codingSystems", filters.codingSystems.filter((v) => v !== value))} />
              ))}
              {filters.accessBodies.map((value) => (
                <FilterChip key={value} label={accessBodyLabels[value] ?? value} onRemove={() => update("accessBodies", filters.accessBodies.filter((v) => v !== value))} />
              ))}
              {filters.linkageStatuses.map((value) => (
                <FilterChip key={value} label={value} onRemove={() => update("linkageStatuses", filters.linkageStatuses.filter((v) => v !== value))} />
              ))}
            </div>
          ) : null}

          {results.length === 0 ? (
            <EmptyState
              title="No datasets match these filters"
              description="Try removing a facet — the counts next to each option show how many datasets it would return against your other selections."
              action={<Button onClick={() => setFilters(EMPTY_FILTERS)}>Clear all filters</Button>}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {results.map((dataset) => {
                const inProject = activeProject?.datasetIds.includes(dataset.id) ?? false;
                return (
                  <li key={dataset.id}>
                    <DatasetCard
                      dataset={dataset}
                      relevance={relevance.get(dataset.id)}
                      inProject={inProject}
                      action={
                        activeProject ? (
                          <Button
                            variant={inProject ? "ghost" : "secondary"}
                            onClick={() =>
                              dispatch(
                                inProject
                                  ? {
                                      type: "remove-dataset",
                                      projectId: activeProject.id,
                                      datasetId: dataset.id,
                                      datasetLabel: `${dataset.acronym} — ${dataset.name}`,
                                      now: now(),
                                    }
                                  : {
                                      type: "add-dataset",
                                      projectId: activeProject.id,
                                      datasetId: dataset.id,
                                      datasetLabel: `${dataset.acronym} — ${dataset.name}`,
                                      now: now(),
                                    },
                              )
                            }
                          >
                            {inProject ? "Remove from project" : "Add to project"}
                          </Button>
                        ) : null
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge tone="cyan" className="pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full px-1 hover:bg-cyan-200"
        aria-label={`Remove filter ${label}`}
      >
        <span aria-hidden="true">×</span>
      </button>
    </Badge>
  );
}
