import type { Metadata } from "next";
import { ReadinessDashboard } from "@/app/projects/[id]/readiness/ReadinessDashboard";

export const metadata: Metadata = {
  title: "Application readiness",
  description:
    "A readiness dashboard identifying missing documents, ambiguous claims, excessive data requests and unresolved dataset incompatibilities, with JSON and print-ready exports.",
};

export default async function ReadinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReadinessDashboard projectId={id} />;
}
