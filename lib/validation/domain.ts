const PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new DomainError("Website URL is required.");
  }

  const withProtocol = PROTOCOL_PATTERN.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new DomainError("Enter a valid website URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new DomainError("Only HTTP and HTTPS URLs are supported.");
  }

  const domain = normalizeDomainFromHostname(parsed.hostname);
  return `https://${domain}`;
}

export function normalizeDomain(input: string): string {
  const url = normalizeWebsiteUrl(input);
  return new URL(url).hostname;
}

function normalizeDomainFromHostname(hostname: string): string {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");

  if (!host) {
    throw new DomainError("Enter a valid website URL.");
  }

  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new DomainError("Localhost URLs cannot be used as company domains.");
  }

  const labels = host.split(".");
  if (labels.length < 2 || labels.some((label) => label.length === 0)) {
    throw new DomainError("Enter a valid website domain.");
  }

  return host.startsWith("www.") ? host.slice(4) : host;
}

export function domainsMatch(left: string, right: string): boolean {
  try {
    return normalizeDomain(left) === normalizeDomain(right);
  } catch {
    return false;
  }
}
