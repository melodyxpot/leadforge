import {
  COMPANY_CATEGORIES,
  HIGH_PRIORITY_SCORE,
  MEDIUM_SCORE,
  PRIORITY_SCORE,
  type CompanyCategory,
  type ScoreBand,
} from "@/lib/constants";

export const SCORE_WEIGHTS = {
  businessFit: 25,
  websiteOpportunity: 30,
  commercialPotential: 20,
  contactability: 10,
  growthSignals: 10,
  dataConfidence: 5,
} as const;

export type ScoreDimension = keyof typeof SCORE_WEIGHTS;

export type ScoreReason = {
  dimension: ScoreDimension;
  points: number;
  max: number;
  reasons: string[];
};

export type LeadScoreBreakdown = {
  businessFit: number;
  websiteOpportunity: number;
  commercialPotential: number;
  contactability: number;
  growthSignals: number;
  dataConfidence: number;
  total: number;
  band: ScoreBand;
  reasons: ScoreReason[];
};

export type ScoringSignals = {
  category: CompanyCategory;
  country?: string | null;
  description?: string | null;
  companySize?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
  hasContactName?: boolean;
  hasContactEmail?: boolean;
  hasContactLinkedin?: boolean;
  hasContactRole?: boolean;
  hasAudit?: boolean;
  overallAuditScore?: number | null;
  opportunityCount?: number;
  highSeverityFindingCount?: number;
};

const CATEGORY_FIT: Record<CompanyCategory, number> = {
  igaming: 25,
  affiliate: 23,
  marketing: 21,
  seo: 20,
  media: 18,
  software: 17,
  payments: 16,
  other: 10,
};

export function scoreBand(total: number): ScoreBand {
  if (total >= PRIORITY_SCORE) return "priority";
  if (total >= HIGH_PRIORITY_SCORE) return "high";
  if (total >= MEDIUM_SCORE) return "medium";
  return "low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreBusinessFit(signals: ScoringSignals): ScoreReason {
  const max = SCORE_WEIGHTS.businessFit;
  let points = CATEGORY_FIT[signals.category] ?? CATEGORY_FIT.other;
  const reasons: string[] = [];

  reasons.push(
    `${formatCategory(signals.category)} is a supported B2B category (${points}/${max}).`,
  );

  if (signals.country) {
    points = Math.min(max, points + 0);
    reasons.push(`Country is known (${signals.country}).`);
  } else {
    points = Math.max(0, points - 3);
    reasons.push("Country is missing, which lowers confidence in market fit.");
  }

  return { dimension: "businessFit", points: clamp(points, 0, max), max, reasons };
}

function scoreWebsiteOpportunity(signals: ScoringSignals): ScoreReason {
  const max = SCORE_WEIGHTS.websiteOpportunity;
  const reasons: string[] = [];

  if (!signals.hasAudit) {
    return {
      dimension: "websiteOpportunity",
      points: 8,
      max,
      reasons: [
        "No website audit yet. A baseline opportunity score is reserved until evidence is collected.",
      ],
    };
  }

  const auditScore = signals.overallAuditScore ?? 0;
  const inverted = Math.round(((100 - auditScore) / 100) * 22);
  let points = inverted;

  reasons.push(
    `Audit overall score is ${auditScore}/100, suggesting ${inverted} opportunity points.`,
  );

  if ((signals.highSeverityFindingCount ?? 0) > 0) {
    const bonus = Math.min(6, (signals.highSeverityFindingCount ?? 0) * 2);
    points += bonus;
    reasons.push(
      `${signals.highSeverityFindingCount} high-severity findings add ${bonus} points.`,
    );
  }

  if ((signals.opportunityCount ?? 0) > 0) {
    const bonus = Math.min(4, signals.opportunityCount ?? 0);
    points += bonus;
    reasons.push(`${signals.opportunityCount} evidenced opportunities add ${bonus} points.`);
  }

  return {
    dimension: "websiteOpportunity",
    points: clamp(points, 0, max),
    max,
    reasons,
  };
}

function scoreCommercialPotential(signals: ScoringSignals): ScoreReason {
  const max = SCORE_WEIGHTS.commercialPotential;
  let points = 8;
  const reasons: string[] = ["A baseline commercial score is applied for a named company."];

  if (signals.companySize) {
    points += 4;
    reasons.push("Company size is known.");
  }

  if (signals.linkedinUrl) {
    points += 4;
    reasons.push("Company LinkedIn URL is available.");
  }

  if (signals.description && signals.description.length > 40) {
    points += 4;
    reasons.push("Company description provides commercial context.");
  }

  return { dimension: "commercialPotential", points: clamp(points, 0, max), max, reasons };
}

function scoreContactability(signals: ScoringSignals): ScoreReason {
  const max = SCORE_WEIGHTS.contactability;
  let points = 0;
  const reasons: string[] = [];

  if (signals.hasContactName) {
    points += 3;
    reasons.push("A contact name is available.");
  }
  if (signals.hasContactRole) {
    points += 2;
    reasons.push("A contact role is available.");
  }
  if (signals.hasContactEmail) {
    points += 4;
    reasons.push("A contact email is available.");
  }
  if (signals.hasContactLinkedin) {
    points += 1;
    reasons.push("A contact LinkedIn URL is available.");
  }

  if (points === 0) {
    reasons.push("No contact details yet. Outreach will be harder until a contact is added.");
  }

  return { dimension: "contactability", points: clamp(points, 0, max), max, reasons };
}

function scoreGrowthSignals(signals: ScoringSignals): ScoreReason {
  const max = SCORE_WEIGHTS.growthSignals;
  let points = 3;
  const reasons: string[] = ["Limited growth-signal data is available before enrichment."];

  if (signals.notes && /hiring|redesign|rebrand|launch|expand/i.test(signals.notes)) {
    points += 4;
    reasons.push("Notes mention a growth or change signal.");
  }

  if (signals.linkedinUrl) {
    points += 2;
    reasons.push("Public company presence can be monitored for growth signals.");
  }

  return { dimension: "growthSignals", points: clamp(points, 0, max), max, reasons };
}

function scoreDataConfidence(signals: ScoringSignals): ScoreReason {
  const max = SCORE_WEIGHTS.dataConfidence;
  const fields = [
    Boolean(signals.country),
    Boolean(signals.description),
    Boolean(signals.companySize),
    Boolean(signals.linkedinUrl),
    Boolean(signals.hasContactName),
    Boolean(signals.hasContactEmail),
    Boolean(signals.hasAudit),
  ];
  const filled = fields.filter(Boolean).length;
  const points = Math.round((filled / fields.length) * max);
  return {
    dimension: "dataConfidence",
    points,
    max,
    reasons: [`${filled} of ${fields.length} core data fields are populated.`],
  };
}

export function calculateLeadScore(signals: ScoringSignals): LeadScoreBreakdown {
  const reasons = [
    scoreBusinessFit(signals),
    scoreWebsiteOpportunity(signals),
    scoreCommercialPotential(signals),
    scoreContactability(signals),
    scoreGrowthSignals(signals),
    scoreDataConfidence(signals),
  ];

  const totals = {
    businessFit: reasons[0].points,
    websiteOpportunity: reasons[1].points,
    commercialPotential: reasons[2].points,
    contactability: reasons[3].points,
    growthSignals: reasons[4].points,
    dataConfidence: reasons[5].points,
  };

  const total = clamp(
    Object.values(totals).reduce((sum, value) => sum + value, 0),
    0,
    100,
  );

  return {
    ...totals,
    total,
    band: scoreBand(total),
    reasons,
  };
}

function formatCategory(category: CompanyCategory): string {
  if (category === "igaming") return "iGaming";
  if (category === "seo") return "SEO";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function isKnownCategory(value: string): value is CompanyCategory {
  return (COMPANY_CATEGORIES as readonly string[]).includes(value);
}
