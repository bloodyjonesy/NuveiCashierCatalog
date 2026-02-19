import type { Metadata } from "next";
import "./globals.css";
import { AdminProvider } from "@/contexts/admin-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { LayoutShell } from "@/components/layout-shell";

export const metadata: Metadata = {
  title: "Nuvei Cashier Catalog",
  description: "Internal theme catalog for Nuvei hosted payment pages",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("nuvei-catalog-theme");if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");})();`,
          }}
        />
        <ThemeProvider>
          <AdminProvider>
            <LayoutShell>{children}</LayoutShell>
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
