"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CredentialsProvider } from "@/components/credentials-provider";
import { useAdmin } from "@/contexts/admin-context";
import { useTheme } from "@/contexts/theme-context";
import { LayoutDashboard, PlusCircle, ExternalLink, Sun, Moon, Palette } from "lucide-react";

const navCatalog = { href: "/", label: "Catalog", icon: LayoutDashboard };
const navCustomize = { href: "/customize", label: "Customize", icon: Palette };
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
      {/* Nuvei docs–style top header: dark bar + logo */}
      <header className="sticky top-0 z-50 border-b border-docs-header-border bg-docs-header text-docs-header-text shrink-0">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-3 shrink-0 mr-8">
            <Image
              src="/nuvei-themes-logo.png"
              alt="Nuvei THEMES"
              width={140}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="flex items-center gap-1 text-sm flex-wrap">
            <Link
              href={navCatalog.href}
              className={`px-3 py-2 rounded-md font-medium transition-colors ${
                pathname === navCatalog.href
                  ? "bg-white/10 text-white"
                  : "text-docs-header-text/85 hover:bg-white/5 hover:text-white"
              }`}
            >
              {navCatalog.label}
            </Link>
            <Link
              href={navCustomize.href}
              className={`px-3 py-2 rounded-md font-medium transition-colors ${
                pathname === navCustomize.href
                  ? "bg-white/10 text-white"
                  : "text-docs-header-text/85 hover:bg-white/5 hover:text-white"
              }`}
            >
              {navCustomize.label}
            </Link>
            {isAdmin &&
              navAdmin.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-md font-medium transition-colors ${
                    pathname === href
                      ? "bg-white/10 text-white"
                      : "text-docs-header-text/85 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-md text-docs-header-text/85 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="[&_button]:text-docs-header-text [&_button]:hover:bg-white/10 [&_button]:hover:text-white">
              <CredentialsProvider />
            </div>
          </div>
        </div>
      </header>

      {/* Docs-style layout: sidebar + main content */}
      <div className="flex-1 flex min-h-0">
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-docs-sidebar-border bg-docs-sidebar py-4">
          <nav className="px-3 space-y-0.5">
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Theme Catalog
            </div>
            <Link
              href={navCatalog.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === navCatalog.href
                  ? "bg-docs-sidebar-active text-docs-sidebar-active-text"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {navCatalog.label}
            </Link>
            <Link
              href={navCustomize.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === navCustomize.href
                  ? "bg-docs-sidebar-active text-docs-sidebar-active-text"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Palette className="h-4 w-4 shrink-0" />
              {navCustomize.label}
            </Link>
            {isAdmin && (
              <>
                <div className="px-3 py-1.5 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </div>
                {navAdmin.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === href
                        ? "bg-docs-sidebar-active text-docs-sidebar-active-text"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
