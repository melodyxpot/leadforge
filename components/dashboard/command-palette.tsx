"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Compass,
  LayoutDashboard,
  Mail,
  Plus,
  ScanSearch,
  Settings,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDashboardActions } from "@/components/dashboard/dashboard-actions";

type SearchLead = {
  id: string;
  name: string;
  domain: string;
};

export function CommandPalette({ leads }: { leads: SearchLead[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { openAddLead } = useDashboardActions();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "n" && !isTypingTarget(event.target)) {
        event.preventDefault();
        openAddLead();
      }
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openAddLead]);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search leads or jump to a page..." />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              openAddLead();
            }}
          >
            <Plus />
            Add lead
          </CommandItem>
          <CommandItem onSelect={() => go("/audits")}>
            <ScanSearch />
            Start audit
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go("/overview")}>
            <LayoutDashboard />
            Go to dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/leads")}>
            <Building2 />
            Open leads
          </CommandItem>
          <CommandItem onSelect={() => go("/discovery")}>
            <Compass />
            Open discovery
          </CommandItem>
          <CommandItem onSelect={() => go("/outreach")}>
            <Mail />
            Open outreach
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings />
            Settings
          </CommandItem>
        </CommandGroup>
        {leads.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Leads">
              {leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`${lead.name} ${lead.domain}`}
                  onSelect={() => go(`/leads/${lead.id}`)}
                >
                  <Building2 />
                  <span className="flex flex-col">
                    <span>{lead.name}</span>
                    <span className="text-xs text-muted-foreground">{lead.domain}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}
