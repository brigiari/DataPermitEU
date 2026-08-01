import Link from "next/link";
import { LinkButton } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="eyebrow mb-2">404</p>
      <h1 className="text-3xl">Page not found</h1>
      <p className="prose-body mt-3">
        That page does not exist in this prototype. If you followed a link to a project, note that
        projects live only in the browser that created them — nothing is stored on a server.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/" variant="primary">
          Back to the landing page
        </LinkButton>
        <LinkButton href="/catalogue">Browse the catalogue</LinkButton>
      </div>
      <p className="mt-8 text-sm text-ink-500">
        Looking for the worked example?{" "}
        <Link href="/projects/demo-adherence-readmission" className="text-cyan-800 hover:underline">
          Open the demo project
        </Link>
        .
      </p>
    </div>
  );
}
