"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/dashboard/sidebar";

export function TopNav({
  email,
  name,
}: {
  email: string | null;
  name: string | null;
}) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4">
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet>
          <SheetTrigger
            aria-label="Open navigation"
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>
      </div>
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", metaKey: true }),
          )
        }
        className="flex h-8 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-3.5" />
        <span className="flex-1">Search leads, pages, actions...</span>
        <Kbd>⌘K</Kbd>
      </button>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Activity">
          <Bell className="size-4" />
        </Button>
        <UserMenu email={email} name={name} />
      </div>
    </header>
  );
}
