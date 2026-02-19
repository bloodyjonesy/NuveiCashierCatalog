"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAdminMode, setAdminMode as persistAdminMode } from "@/lib/credentials";

type AdminContextValue = {
  isAdmin: boolean;
  setAdmin: (value: boolean) => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setAdminState] = useState(false);

  useEffect(() => {
    setAdminState(getAdminMode());
  }, []);

  const setAdmin = useCallback((value: boolean) => {
    persistAdminMode(value);
    setAdminState(value);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, setAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    return {
      isAdmin: false,
      setAdmin: () => {},
    };
  }
  return ctx;
}
