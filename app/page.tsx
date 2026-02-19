import Link from "next/link";
import { CatalogGrid } from "@/components/catalog-grid";

export default function CatalogPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Theme Catalog</h1>
      <CatalogGrid />
    </div>
  );
}
