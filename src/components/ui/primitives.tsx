import Link from "next/link";
import type { ReactNode } from "react";

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  as: Tag = "div",
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  id?: string;
}) {
  return (
    <Tag id={id} className={cx("surface p-5", className)}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  id?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h2 id={id} className="text-xl sm:text-2xl">
          {title}
        </h2>
        {description ? <div className="prose-body mt-2">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type BadgeTone = "neutral" | "cyan" | "gold" | "positive" | "caution" | "critical";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  cyan: "bg-cyan-50 text-cyan-900 border-cyan-200",
  gold: "bg-gold-50 text-gold-800 border-gold-200",
  positive: "bg-emerald-50 text-emerald-900 border-emerald-200",
  caution: "bg-amber-50 text-amber-900 border-amber-300",
  critical: "bg-rose-50 text-rose-900 border-rose-200",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "on-dark" | "on-dark-primary";

/**
 * Variants are enumerated rather than composed from utility overrides. Passing
 * a conflicting `bg-*` or `text-*` through `className` does not reliably win in
 * Tailwind — precedence comes from the order rules are emitted in the compiled
 * stylesheet, not from the order they appear in the class attribute — so a
 * button that needs a different ground gets a variant of its own.
 */
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink-800 text-parchment-50 hover:bg-ink-900 border-ink-800",
  secondary: "bg-white text-ink-800 hover:bg-parchment-200 border-ink-300",
  ghost: "bg-transparent text-ink-700 hover:bg-ink-100 border-transparent",
  danger: "bg-white text-rose-800 hover:bg-rose-50 border-rose-300",
  "on-dark": "bg-ink-800/60 text-parchment-50 hover:bg-ink-700 border-ink-500",
  "on-dark-primary": "bg-cyan-600 text-white hover:bg-cyan-700 border-cyan-600",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded border px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  children,
  variant = "secondary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type={type} className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link href={href} className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Definition row used across dataset profiles and application summaries.
 * A <dl> gives assistive technology the term/description relationship that a
 * two-column grid alone would not convey.
 */
export function DefinitionList({
  items,
  columns = 2,
}: {
  items: { term: string; description: ReactNode }[];
  columns?: 1 | 2 | 3;
}) {
  const gridClass =
    columns === 1 ? "sm:grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <dl className={cx("grid grid-cols-1 gap-x-6 gap-y-4", gridClass)}>
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{item.term}</dt>
          <dd className="mt-1 text-[0.9375rem] text-ink-800">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * A labelled horizontal meter. Uses role="meter" with explicit aria values so
 * the number is available to screen readers, not just conveyed by bar width.
 */
export function QualityMeter({
  label,
  value,
  description,
  tone = "cyan",
}: {
  label: string;
  value: number;
  description?: string;
  tone?: "cyan" | "gold" | "ink";
}) {
  const barTone =
    tone === "gold" ? "bg-gold-400" : tone === "ink" ? "bg-ink-500" : "bg-cyan-500";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-800">{label}</span>
        <span className="font-mono text-xs tabular-nums text-ink-600">{value}/100</span>
      </div>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${value} out of 100`}
        className="h-2 w-full overflow-hidden rounded-full bg-ink-100"
      >
        <div className={cx("h-full rounded-full", barTone)} style={{ width: `${value}%` }} />
      </div>
      {description ? <p className="mt-1 text-xs text-ink-500">{description}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "caution" | "trust";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-cyan-300 bg-cyan-50/70 text-cyan-950",
    caution: "border-amber-300 bg-amber-50/70 text-amber-950",
    trust: "border-gold-300 bg-gold-50/60 text-ink-800",
  } as const;
  return (
    <div className={cx("rounded-lg border p-4 text-sm leading-relaxed", tones[tone])}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="[&_a]:underline [&_a]:underline-offset-2">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-muted flex flex-col items-center gap-3 p-10 text-center">
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      <p className="max-w-md text-sm text-ink-600">{description}</p>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "neutral" | "attention" | "positive";
}) {
  const valueTone =
    tone === "attention" ? "text-amber-800" : tone === "positive" ? "text-emerald-800" : "text-ink-900";
  return (
    <div className="surface-muted p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className={cx("mt-1 text-2xl font-semibold tabular-nums", valueTone)}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-ink-500">{detail}</p> : null}
    </div>
  );
}
