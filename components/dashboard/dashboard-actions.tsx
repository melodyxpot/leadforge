"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";

type DashboardActions = {
  openAddLead: () => void;
};

const DashboardActionsContext = createContext<DashboardActions | null>(null);

export function DashboardActionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const value = useMemo(
    () => ({
      openAddLead: () => setAddLeadOpen(true),
    }),
    [],
  );

  return (
    <DashboardActionsContext.Provider value={value}>
      {children}
      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </DashboardActionsContext.Provider>
  );
}

export function useDashboardActions() {
  const context = useContext(DashboardActionsContext);
  if (!context) {
    throw new Error("useDashboardActions must be used within the dashboard.");
  }
  return context;
}
