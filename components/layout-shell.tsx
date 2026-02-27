"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "@/contexts/admin-context";
import { useTheme } from "@/contexts/theme-context";
import {
  LayoutDashboard,
  PlusCircle,
  ExternalLink,
  Sun,
  Moon,
  Palette,
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  Monitor,
  Smartphone,
} from "lucide-react";
import { checkAdminPassword } from "@/lib/credentials";
import type { ThemeRecord } from "@/lib/types";

const navCatalog = { href: "/", label: "Catalog", icon: LayoutDashboard };
const DOCS_URL = "https://docs.nuvei.com";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, setAdmin } = useAdmin();
  const { theme, setTheme } = useTheme();
  const [themes, setThemes] = useState<ThemeRecord[]>([]);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(true);

  useEffect(() => {
    fetch("/api/themes")
      .then((r) => r.json())
      .then((data) => setThemes(Array.isArray(data) ? data : []))
      .catch(() => setThemes([]));
  }, []);

  const desktopThemes = themes.filter((t) => t.device_type !== "mobile");
  const mobileThemes = themes.filter((t) => t.device_type === "mobile");

  const handleAdminLogin = () => {
    const password = window.prompt("Admin password");
    if (password !== null && checkAdminPassword(password)) {
      setAdmin(true);
    } else if (password !== null) {
      window.alert("Incorrect password");
    }
  };

  const handleExitAdmin = () => {
    setAdmin(false);
  };

  const adminNav = [
    { href: "/add", label: "Add theme", icon: PlusCircle },
    { href: "/test", label: "Test link", icon: ExternalLink },
    { href: "/customize", label: "Customize", icon: Palette },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header: logo text + Catalog + Back to Nuvei Docs + theme toggle */}
      <header className="sticky top-0 z-50 border-b border-docs-header-border bg-docs-header text-docs-header-text shrink-0">
        <div className="flex h-14 items-center px-4 lg:px-6">
          <Link
            href="/"
            className="shrink-0 mr-8 font-semibold text-lg text-white hover:text-white/90 transition-colors"
          >
            Nuvei Themes
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
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-docs-header-text/90 hover:text-white transition-colors"
            >
              Back to Nuvei Docs
            </a>
            <button
              type="button"
              className="p-2 rounded-md text-docs-header-text/85 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-docs-sidebar-border bg-docs-sidebar">
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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

            {/* Desktop themes dropdown */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDesktopOpen(!desktopOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
              >
                <Monitor className="h-4 w-4 shrink-0" />
                <span className="flex-1">Desktop</span>
                {desktopOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              {desktopOpen && (
                <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-docs-sidebar-border pl-3 py-1">
                  {desktopThemes.length === 0 ? (
                    <li className="text-xs text-muted-foreground py-1">No desktop themes</li>
                  ) : (
                    desktopThemes.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/theme/${t.id}`}
                          className={`block py-1.5 px-2 rounded text-sm transition-colors ${
                            pathname === `/theme/${t.id}`
                              ? "bg-docs-sidebar-active text-docs-sidebar-active-text font-medium"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {/* Mobile themes dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="flex-1">Mobile</span>
                {mobileOpen ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
              </button>
              {mobileOpen && (
                <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-docs-sidebar-border pl-3 py-1">
                  {mobileThemes.length === 0 ? (
                    <li className="text-xs text-muted-foreground py-1">No mobile themes</li>
                  ) : (
                    mobileThemes.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/theme/${t.id}`}
                          className={`block py-1.5 px-2 rounded text-sm transition-colors ${
                            pathname === `/theme/${t.id}`
                              ? "bg-docs-sidebar-active text-docs-sidebar-active-text font-medium"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {isAdmin && (
              <>
                <div className="px-3 py-1.5 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </div>
                {adminNav.map(({ href, label, icon: Icon }) => (
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

          {/* Bottom: Admin login or Exit admin */}
          <div className="p-3 border-t border-docs-sidebar-border">
            {isAdmin ? (
              <button
                type="button"
                onClick={handleExitAdmin}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Exit admin
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdminLogin}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                Admin login
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
