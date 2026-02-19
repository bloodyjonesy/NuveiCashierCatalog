"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CredentialsProvider } from "@/components/credentials-provider";
import { useAdmin } from "@/contexts/admin-context";
import { useTheme } from "@/contexts/theme-context";
import { LayoutDashboard, PlusCircle, ExternalLink, Sun, Moon } from "lucide-react";

const navCatalog = { href: "/", label: "Catalog", icon: LayoutDashboard };
const navAdmin = [
  { href: "/add", label: "Add theme", icon: PlusCircle },
  { href: "/test", label: "Test link", icon: ExternalLink },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAdmin();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="font-semibold text-lg mr-6">
            Nuvei Cashier Catalog
          </Link>
          <nav className="flex items-center gap-1">
            <Link href={navCatalog.href}>
              <Button
                variant={pathname === navCatalog.href ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <navCatalog.icon className="h-4 w-4" />
                {navCatalog.label}
              </Button>
            </Link>
            {isAdmin &&
              navAdmin.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <Button
                    variant={pathname === href ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <CredentialsProvider />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
