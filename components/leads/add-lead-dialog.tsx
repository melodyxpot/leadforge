"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { createLeadAction } from "@/lib/actions/leads";
import {
  COMPANY_CATEGORIES,
  COMPANY_CATEGORY_LABELS,
  type CompanyCategory,
} from "@/lib/constants";
import { createCompanySchema } from "@/lib/validation/company";

type LeadFormValues = {
  name: string;
  websiteUrl: string;
  category: CompanyCategory;
  country: string;
  contactName: string;
  contactRole: string;
  email: string;
  linkedinUrl: string;
  notes: string;
};
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const form = useForm<LeadFormValues>({
    defaultValues: {
      name: "",
      websiteUrl: "",
      category: "igaming",
      country: "",
      contactName: "",
      contactRole: "",
      email: "",
      linkedinUrl: "",
      notes: "",
    },
  });
  const category = useWatch({ control: form.control, name: "category" });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setCreatedId(null);
      form.reset();
    }
    onOpenChange(next);
  }

  function onSubmit(values: LeadFormValues) {
    const parsed = createCompanySchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path[0]) {
        form.setError(issue.path[0] as keyof LeadFormValues, {
          message: issue.message,
        });
      } else {
        toast.error(issue?.message ?? "Check the lead details.");
      }
      return;
    }

    startTransition(async () => {
      const result = await createLeadAction(parsed.data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCreatedId(result.data.id);
      toast.success("Lead added");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{createdId ? "Lead ready" : "Add lead"}</DialogTitle>
          <DialogDescription>
            {createdId
              ? "The company is in your workspace. Analyze the website when you want evidence-backed scoring."
              : "Website URL is the most important field. LeadForge will normalize the domain and avoid duplicates."}
          </DialogDescription>
        </DialogHeader>

        {createdId ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                handleOpenChange(false);
                router.push(`/leads/${createdId}`);
              }}
            >
              Open lead
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                router.push("/audits");
              }}
            >
              Analyze website
            </Button>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Field label="Company name" error={form.formState.errors.name?.message}>
              <Input placeholder="Northstar Affiliates" {...form.register("name")} />
            </Field>
            <Field label="Website URL" error={form.formState.errors.websiteUrl?.message}>
              <Input placeholder="https://example.com" {...form.register("websiteUrl")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select
                  value={category}
                  onValueChange={(value) =>
                    form.setValue("category", value as CompanyCategory)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {COMPANY_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Country">
                <Input placeholder="United Kingdom" {...form.register("country")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact name">
                <Input placeholder="Alex Morgan" {...form.register("contactName")} />
              </Field>
              <Field label="Contact role">
                <Input placeholder="Head of Growth" {...form.register("contactRole")} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input type="email" placeholder="alex@example.com" {...form.register("email")} />
              </Field>
              <Field label="LinkedIn URL">
                <Input placeholder="https://linkedin.com/in/..." {...form.register("linkedinUrl")} />
              </Field>
            </div>
            <Field label="Notes">
              <Textarea
                placeholder="Why this company looks like a fit..."
                {...form.register("notes")}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Add lead"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
