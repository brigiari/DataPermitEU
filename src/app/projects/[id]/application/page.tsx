import type { Metadata } from "next";
import { ApplicationBuilder } from "@/app/projects/[id]/application/ApplicationBuilder";

export const metadata: Metadata = {
  title: "Application builder",
  description:
    "A guided, autosaving builder covering research purpose, public interest, requested variables, population, analysis plan, documentation, access duration and expected outputs.",
};

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationBuilder projectId={id} />;
}
