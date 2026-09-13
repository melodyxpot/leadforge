"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import { bulkAuditLeadsAction, bulkTagLeadsAction } from "@/lib/actions/leads";
import {
  COMPANY_CATEGORIES,
  COMPANY_CATEGORY_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  PAGE_SIZE,
} from "@/lib/constants";
import type { CompanyListItem } from "@/lib/db/companies";
import { useDashboardActions } from "@/components/dashboard/dashboard-actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { ScoreBadge } from "@/components/leads/score-badge";
import { StatusBadge } from "@/components/leads/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, CompanyListItem>();

export function LeadsWorkspace({
  rows,
  total,
  page,
}: {
  rows: CompanyListItem[];
  total: number;
  page: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openAddLead } = useDashboardActions();
  const [selected, setSelected] = useState<string[]>([]);
  const [tag, setTag] = useState("");
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: "select",
          header: "",
          cell: ({ row }) => (
            <Checkbox
              checked={selected.includes(row.original.id)}
              onCheckedChange={(checked) => {
                setSelected((current) =>
                  checked
                    ? [...current, row.original.id]
                    : current.filter((id) => id !== row.original.id),
                );
              }}
              aria-label={`Select ${row.original.name}`}
            />
          ),
        }),
        helper.accessor("name", {
          header: "Company",
          cell: ({ row }) => (
            <Link href={`/leads/${row.original.id}`} className="block">
              <div className="font-medium text-foreground">{row.original.name}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {row.original.domain}
              </div>
            </Link>
          ),
        }),
        helper.accessor("category", {
          header: "Category",
          cell: ({ getValue }) => COMPANY_CATEGORY_LABELS[getValue()],
        }),
        helper.accessor("country", {
          header: "Country",
          cell: ({ getValue }) => getValue() || "—",
        }),
        helper.accessor("total_score", {
          header: "Score",
          cell: ({ getValue }) => <ScoreBadge score={getValue()} />,
        }),
        helper.display({
          id: "opportunity",
          header: "Opportunity",
          cell: ({ row }) => row.original.recommended_service || "Needs audit",
        }),
        helper.accessor("status", {
          header: "Status",
          cell: ({ getValue }) => <StatusBadge status={getValue()} />,
        }),
        helper.accessor("last_activity_at", {
          header: "Last activity",
          cell: ({ getValue }) => {
            const value = getValue();
            return value
              ? formatDistanceToNow(new Date(value), { addSuffix: true })
              : "—";
          },
        }),
        helper.accessor("created_at", {
          header: "Created",
          cell: ({ getValue }) =>
            formatDistanceToNow(new Date(getValue()), { addSuffix: true }),
        }),
      ]),
    [selected],
  );

  const table = useTable({
    features,
    columns,
    data: rows,
  });

  function updateParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Search, qualify, and decide who is worth contacting."
        actions={
          <Button onClick={openAddLead}>
            <Plus data-icon="inline-start" />
            Add lead
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Search company, domain, contact, email"
          className="lg:max-w-sm"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              updateParam("q", event.currentTarget.value);
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={searchParams.get("status") ?? "all"}
            placeholder="Status"
            onChange={(value) => updateParam("status", value)}
            options={LEAD_STATUSES.map((status) => ({
              value: status,
              label: LEAD_STATUS_LABELS[status],
            }))}
          />
          <FilterSelect
            value={searchParams.get("category") ?? "all"}
            placeholder="Category"
            onChange={(value) => updateParam("category", value)}
            options={COMPANY_CATEGORIES.map((category) => ({
              value: category,
              label: COMPANY_CATEGORY_LABELS[category],
            }))}
          />
          <FilterSelect
            value={searchParams.get("score") ?? "all"}
            placeholder="Score"
            onChange={(value) => updateParam("score", value)}
            options={[
              { value: "priority", label: "Priority" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <FilterSelect
            value={searchParams.get("contactStatus") ?? "all"}
            placeholder="Contact"
            onChange={(value) => updateParam("contactStatus", value)}
            options={[
              { value: "has_contact", label: "Has contact" },
              { value: "missing_contact", label: "Missing contact" },
            ]}
          />
          <FilterSelect
            value={searchParams.get("auditStatus") ?? "all"}
            placeholder="Audit"
            onChange={(value) => updateParam("auditStatus", value)}
            options={[
              { value: "none", label: "No audit" },
              { value: "queued", label: "Queued" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
            ]}
          />
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {selected.length} selected
          </span>
          <Input
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            placeholder="Tag name"
            className="w-40"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !tag.trim()}
            onClick={() =>
              startTransition(async () => {
                const result = await bulkTagLeadsAction({
                  companyIds: selected,
                  tag,
                });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Tags added");
                setTag("");
              })
            }
          >
            Bulk tag
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await bulkAuditLeadsAction({ companyIds: selected });
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success(`${result.data.queued} audit jobs queued`);
              })
            }
          >
            Bulk audit
          </Button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No leads yet."
          description="Add your first prospect and let LeadForge analyze the opportunity."
          action={
            <Button onClick={openAddLead}>
              <Plus data-icon="inline-start" />
              Add lead
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder ? null : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id} className="align-top">
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-sm text-muted-foreground">
            <span>
              {total} lead{total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(page - 1));
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Previous
              </Button>
              <span>
                {page} / {pageCount}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pageCount}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(page + 1));
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder.toLowerCase()}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
