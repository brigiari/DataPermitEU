import type { Metadata } from "next";
import { CatalogueClient } from "@/app/catalogue/CatalogueClient";

export const metadata: Metadata = {
  title: "Dataset catalogue",
  description:
    "Faceted discovery across a fictional catalogue of European health datasets, filtered by country, disease area, data category, population, coverage, terminology, access body and data-quality indicators.",
};

export default function CataloguePage() {
  return <CatalogueClient />;
}
