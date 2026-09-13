export const APP_NAME = "LeadForge";

export const COMPANY_CATEGORIES = [
  "igaming",
  "affiliate",
  "marketing",
  "seo",
  "media",
  "software",
  "payments",
  "other",
] as const;

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];

export const COMPANY_CATEGORY_LABELS: Record<CompanyCategory, string> = {
  igaming: "iGaming",
  affiliate: "Affiliate",
  marketing: "Marketing",
  seo: "SEO",
  media: "Media",
  software: "Software",
  payments: "Payments",
  other: "Other",
};

export const LEAD_STATUSES = [
  "new",
  "researched",
  "qualified",
  "contacted",
  "replied",
  "meeting",
  "proposal",
  "won",
  "lost",
  "nurture",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  researched: "Researched",
  qualified: "Qualified",
  contacted: "Contacted",
  replied: "Replied",
  meeting: "Meeting",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
  nurture: "Nurture",
};

export const CONTACTED_STATUSES: LeadStatus[] = [
  "contacted",
  "replied",
  "meeting",
  "proposal",
  "won",
];

export const REPLIED_STATUSES: LeadStatus[] = [
  "replied",
  "meeting",
  "proposal",
  "won",
];

export const COMPANY_SOURCES = [
  "manual",
  "csv",
  "url_paste",
  "discovery",
] as const;

export type CompanySource = (typeof COMPANY_SOURCES)[number];

export const WEBSITE_STATUSES = [
  "unknown",
  "pending",
  "crawled",
  "failed",
] as const;

export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const AUDIT_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
] as const;

export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const SCORE_BANDS = ["priority", "high", "medium", "low"] as const;

export type ScoreBand = (typeof SCORE_BANDS)[number];

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  priority: "Priority",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const PAGE_SIZE = 25;

export const HIGH_PRIORITY_SCORE = 75;
export const PRIORITY_SCORE = 90;
export const MEDIUM_SCORE = 60;
