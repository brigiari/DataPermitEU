import Link from "next/link";
import { cx } from "@/components/ui/primitives";

/**
 * The independence disclaimer.
 *
 * This appears in the site header on every page, in full on the landing page,
 * and in every export. It is intentionally not dismissible: a prototype that
 * imitates a public-sector service has an obligation to keep saying what it is
 * not, and burying that in a footer would be the wrong call.
 */
export function DisclaimerBanner({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "border-b border-gold-300/70 bg-gold-50 text-ink-800",
        className,
      )}
      role="note"
      aria-label="Independence disclaimer"
    >
      <div className="mx-auto max-w-7xl px-4 py-2 text-[0.8125rem] leading-snug sm:px-6">
        <span className="font-semibold">Independent fictional prototype.</span>{" "}
        Not affiliated with, endorsed by, or representing the European Commission, the European
        Health Data Space, HealthData@EU, or any national Health Data Access Body. All datasets,
        institutions and requirements shown here are invented.{" "}
        <Link href="/methodology" className="font-medium underline underline-offset-2">
          Methodology and limitations
        </Link>
      </div>
    </div>
  );
}

export function DisclaimerPanel() {
  return (
    <section
      aria-labelledby="independence-disclaimer"
      className="rounded-xl border-2 border-gold-300 bg-gold-50/80 p-6 sm:p-8"
    >
      <p className="eyebrow mb-2 text-gold-800">Please read first</p>
      <h2 id="independence-disclaimer" className="text-xl sm:text-2xl">
        This is an independent fictional prototype
      </h2>
      <div className="prose-body mt-3 max-w-3xl space-y-3 text-ink-800">
        <p>
          DataPermit EU is a personal portfolio project. It is <strong>not</strong> an official
          service of the European Commission, the European Health Data Space, HealthData@EU, or any
          national Health Data Access Body. It is not affiliated with, endorsed by, or connected to
          any of them, and it does not use their branding.
        </p>
        <p>
          Every dataset, data holder, access body, catalogue reference, requirement, quality score
          and approval outcome in this application is <strong>invented</strong>. Nothing here
          describes a real catalogue or a real access process, and none of it should be used to plan
          an actual data-access application.
        </p>
        <p>
          The guidance the application produces is <strong>educational only</strong>. It contains no
          legal conclusions and gives no legal, ethical or regulatory advice. Any real research
          project must be confirmed with the relevant legal advisers, research ethics committee, and
          the competent data-access authority.
        </p>
        <p>
          The educational timeline and glossary describe the real, publicly documented European
          Health Data Space at a high level, and link to official sources so you can check them.
          Everything else is fiction built to demonstrate a product design.
        </p>
      </div>
    </section>
  );
}

/** Compact restatement placed above exports and application summaries. */
export function ExportDisclaimer() {
  return (
    <div className="rounded border border-gold-300 bg-gold-50 p-3 text-xs leading-relaxed text-ink-800">
      <strong>Fictional prototype output.</strong> This is not an official European Commission,
      EHDS, HealthData@EU or national Health Data Access Body form and has no standing in any real
      data-access process. Datasets, requirements and references are invented. Confirm everything
      with the relevant legal, ethical and data-access authorities.
    </div>
  );
}
