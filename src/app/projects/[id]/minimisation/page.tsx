import type { Metadata } from "next";
import { MinimisationReview } from "@/app/projects/[id]/minimisation/MinimisationReview";

export const metadata: Metadata = {
  title: "Data minimisation review",
  description:
    "A per-variable review that flags direct identifiers, missing justifications, available coarser forms and variables with no visible link to the stated research purpose.",
};

export default async function MinimisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MinimisationReview projectId={id} />;
}
