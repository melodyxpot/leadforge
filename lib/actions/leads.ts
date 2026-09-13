"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth/workspace";
import {
  addCompanyTags,
  createCompany,
  queueWebsiteAudits,
  updateLeadStatus,
} from "@/lib/db/companies";
import { AppError } from "@/lib/db/errors";
import {
  createCompanySchema,
  updateLeadStatusSchema,
} from "@/lib/validation/company";
import { z } from "zod";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createLeadAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead details." };
  }

  try {
    const { workspace } = await requireWorkspace();
    const company = await createCompany(workspace.id, parsed.data);
    revalidatePath("/leads");
    revalidatePath("/overview");
    return { ok: true, data: { id: company.id } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AppError
          ? error.message
          : "Unable to create this lead. Try again.",
    };
  }
}

export async function updateLeadStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateLeadStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid status update." };
  }

  try {
    const { workspace } = await requireWorkspace();
    await updateLeadStatus(workspace.id, parsed.data.companyId, parsed.data.status);
    revalidatePath("/leads");
    revalidatePath(`/leads/${parsed.data.companyId}`);
    revalidatePath("/overview");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AppError ? error.message : "Unable to update status.",
    };
  }
}

const bulkTagSchema = z.object({
  companyIds: z.array(z.string().uuid()).min(1),
  tag: z.string().trim().min(1).max(40),
});

export async function bulkTagLeadsAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = bulkTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Choose leads and a tag name." };
  }

  try {
    const { workspace } = await requireWorkspace();
    await addCompanyTags(workspace.id, parsed.data.companyIds, parsed.data.tag);
    revalidatePath("/leads");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof AppError ? error.message : "Unable to tag leads.",
    };
  }
}

const bulkAuditSchema = z.object({
  companyIds: z.array(z.string().uuid()).min(1),
});

export async function bulkAuditLeadsAction(
  input: unknown,
): Promise<ActionResult<{ queued: number }>> {
  const parsed = bulkAuditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Choose at least one lead." };
  }

  try {
    const { workspace } = await requireWorkspace();
    const queued = await queueWebsiteAudits(workspace.id, parsed.data.companyIds);
    revalidatePath("/audits");
    revalidatePath("/leads");
    return { ok: true, data: { queued } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof AppError ? error.message : "Unable to queue audits.",
    };
  }
}
