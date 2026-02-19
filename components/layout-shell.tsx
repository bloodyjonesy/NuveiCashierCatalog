"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CredentialsProvider } from "@/components/credentials-provider";
import { LayoutDashboard, PlusCircle, ExternalLink } from "lucide-react";

const nav = [
  { href: "/", label: "Catalog", icon: LayoutDashboard },
  { href: "/add", label: "Add theme", icon: PlusCircle },
  { href: "/test", label: "Test link", icon: ExternalLink },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="font-semibold text-lg mr-6">
            Nuvei Cashier Catalog
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => (
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
          <div className="ml-auto">
            <CredentialsProvider />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
