"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Compass,
  ScanSearch,
  Mail,
  Settings,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Building2 },
  { href: "/discovery", label: "Discovery", icon: Compass },
  { href: "/audits", label: "Audits", icon: ScanSearch },
  { href: "/outreach", label: "Outreach", icon: Mail },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-full flex-col bg-sidebar"
          : "hidden w-60 shrink-0 border-r border-border bg-sidebar lg:flex lg:flex-col"
      }
    >
      <div className="flex h-14 items-center px-5">
        <Link href="/overview" className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md border border-border bg-background font-mono text-[11px] font-medium">
            LF
          </span>
          <span className="text-sm font-medium tracking-tight">{APP_NAME}</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col px-3 py-4">
        <p className="px-2 pb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Workspace
        </p>
        <div className="space-y-0.5">
          {PRIMARY_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto border-t border-sidebar-border pt-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </nav>
    </aside>
  );
}
