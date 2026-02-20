import { redirect } from "next/navigation";

export default function ThemeCustomizeRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect("/customize");
}
