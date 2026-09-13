import { describe, expect, it } from "vitest";
import { calculateLeadScore, SCORE_WEIGHTS, scoreBand } from "@/lib/scoring";

describe("lead scoring", () => {
  it("stays within 100 and keeps dimension caps", () => {
    const score = calculateLeadScore({
      category: "igaming",
      country: "Malta",
      description: "iGaming affiliate network with multiple landing pages.",
      companySize: "51-200",
      linkedinUrl: "https://linkedin.com/company/example",
      notes: "Hiring a frontend lead and planning a redesign.",
      hasContactName: true,
      hasContactEmail: true,
      hasContactLinkedin: true,
      hasContactRole: true,
      hasAudit: true,
      overallAuditScore: 42,
      opportunityCount: 3,
      highSeverityFindingCount: 2,
    });

    expect(score.total).toBeLessThanOrEqual(100);
    expect(score.businessFit).toBeLessThanOrEqual(SCORE_WEIGHTS.businessFit);
    expect(score.websiteOpportunity).toBeLessThanOrEqual(
      SCORE_WEIGHTS.websiteOpportunity,
    );
    expect(score.reasons).toHaveLength(6);
    expect(score.band).toBe(scoreBand(score.total));
  });

  it("does not invent website opportunity without an audit", () => {
    const score = calculateLeadScore({
      category: "other",
    });

    expect(score.websiteOpportunity).toBe(8);
    expect(score.reasons[1]?.reasons[0]).toMatch(/No website audit/);
    expect(score.band).toBe("low");
  });

  it("maps score bands from the product thresholds", () => {
    expect(scoreBand(91)).toBe("priority");
    expect(scoreBand(80)).toBe("high");
    expect(scoreBand(60)).toBe("medium");
    expect(scoreBand(59)).toBe("low");
  });
});
