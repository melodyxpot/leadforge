import { describe, expect, it } from "vitest";
import {
  createCompanySchema,
  domainFromCreateInput,
} from "@/lib/validation/company";

describe("createCompanySchema", () => {
  it("normalizes the website URL and accepts optional contact fields", () => {
    const parsed = createCompanySchema.parse({
      name: "Lumen Media",
      websiteUrl: "www.lumenmedia.example",
      category: "media",
      country: "United Kingdom",
      email: "",
    });

    expect(parsed.websiteUrl).toBe("https://lumenmedia.example");
    expect(parsed.email).toBeUndefined();
    expect(domainFromCreateInput(parsed)).toBe("lumenmedia.example");
  });

  it("rejects invalid websites and email addresses", () => {
    expect(() =>
      createCompanySchema.parse({
        name: "Bad",
        websiteUrl: "not a url",
        category: "seo",
      }),
    ).toThrow();

    expect(() =>
      createCompanySchema.parse({
        name: "Bad",
        websiteUrl: "https://valid.com",
        category: "seo",
        email: "not-an-email",
      }),
    ).toThrow();
  });
});
