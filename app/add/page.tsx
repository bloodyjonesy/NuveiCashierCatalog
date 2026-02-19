import { AddThemeForm } from "@/components/add-theme-form";
import { AddThemeGuard } from "@/components/add-theme-guard";

export default function AddThemePage() {
  return (
    <AddThemeGuard>
      <div>
        <h1 className="text-2xl font-semibold mb-6">Add theme</h1>
        <AddThemeForm />
      </div>
    </AddThemeGuard>
  );
}
