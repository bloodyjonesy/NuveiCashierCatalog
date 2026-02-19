import type { Metadata } from "next";
import "./globals.css";
import { AdminProvider } from "@/contexts/admin-context";
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
    <html lang="en">
      <body>
        <AdminProvider>
          <LayoutShell>{children}</LayoutShell>
        </AdminProvider>
      </body>
    </html>
  );
}
