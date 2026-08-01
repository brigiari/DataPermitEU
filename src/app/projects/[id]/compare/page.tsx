import type { Metadata } from "next";
import { CompareWorkspace } from "@/app/projects/[id]/compare/CompareWorkspace";

export const metadata: Metadata = {
  title: "Dataset comparison",
  description:
    "Pairwise compatibility across the datasets in a project: linkage routes, shared coverage, population overlap, terminology conflicts and governing access conditions.",
};

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompareWorkspace projectId={id} />;
}
