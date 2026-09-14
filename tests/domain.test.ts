import { describe, expect, it } from "vitest";
import {
  DomainError,
  domainsMatch,
  normalizeDomain,
  normalizeWebsiteUrl,
} from "@/lib/validation/domain";

describe("normalizeDomain", () => {
  it("collapses protocol, www, and trailing slash variants", () => {
    expect(normalizeDomain("https://www.example.com/")).toBe("example.com");
    expect(normalizeDomain("https://example.com")).toBe("example.com");
    expect(normalizeDomain("http://example.com")).toBe("example.com");
    expect(normalizeDomain("example.com")).toBe("example.com");
    expect(normalizeDomain("www.example.com/careers")).toBe("example.com");
  });

  it("rejects unsupported protocols and localhost", () => {
    expect(() => normalizeDomain("ftp://example.com")).toThrow(DomainError);
    expect(() => normalizeDomain("localhost")).toThrow(DomainError);
    expect(() => normalizeDomain("")).toThrow(DomainError);
  });

  it("builds a canonical https website URL", () => {
    expect(normalizeWebsiteUrl("www.northstar-affiliates.com")).toBe(
      "https://northstar-affiliates.com",
    );
  });

  it("treats equivalent URLs as the same company", () => {
    expect(domainsMatch("https://www.example.com/", "http://example.com")).toBe(
      true,
    );
    expect(domainsMatch("https://example.com", "https://other.com")).toBe(false);
  });
});
