import { z } from "zod";
import { COMPANY_CATEGORIES, LEAD_STATUSES } from "@/lib/constants";
import { normalizeDomain, normalizeWebsiteUrl } from "@/lib/validation/domain";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required.").max(200),
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Website URL is required.")
    .transform((value, ctx) => {
      try {
        return normalizeWebsiteUrl(value);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            error instanceof Error ? error.message : "Enter a valid website URL.",
        });
        return z.NEVER;
      }
    }),
  category: z.enum(COMPANY_CATEGORIES),
  country: optionalText,
  contactName: optionalText,
  contactRole: optionalText,
  email: z
    .union([z.email(), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  linkedinUrl: optionalText,
  notes: optionalText,
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateLeadStatusSchema = z.object({
  companyId: z.string().uuid(),
  status: z.enum(LEAD_STATUSES),
});

export function domainFromCreateInput(input: CreateCompanyInput): string {
  return normalizeDomain(input.websiteUrl);
}

export const leadSearchSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  category: z.enum(COMPANY_CATEGORIES).optional(),
  country: z.string().trim().optional(),
  score: z.enum(["priority", "high", "medium", "low"]).optional(),
  auditStatus: z.enum(["none", "queued", "running", "completed", "failed"]).optional(),
  contactStatus: z.enum(["any", "has_contact", "missing_contact"]).optional(),
  tag: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  sort: z
    .enum(["score", "name", "created_at", "last_activity"])
    .default("score"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type LeadSearchInput = z.infer<typeof leadSearchSchema>;
