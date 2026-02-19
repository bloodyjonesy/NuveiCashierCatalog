"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/contexts/admin-context";

export function AddThemeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAdmin) router.replace("/");
  }, [mounted, isAdmin, router]);

  if (!mounted) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Checking access…
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Admin access required. Unlock via Credentials → Admin mode.
      </div>
    );
  }
  return <>{children}</>;
}
