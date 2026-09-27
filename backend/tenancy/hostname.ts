const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const RESERVED_MERCHANT_CODES = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "cdn",
  "mail",
  "status",
  "support",
  "www",
]);

export const normalizeHostname = (value: string | null | undefined): string => {
  if (!value) return "";

  const firstHost = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!firstHost) return "";

  // IPv6 localhost may arrive as [::1]:3000.
  if (firstHost.startsWith("[")) {
    const closingBracket = firstHost.indexOf("]");
    return closingBracket >= 0 ? firstHost.slice(1, closingBracket) : "";
  }

  const withoutPort = firstHost.replace(/:\d+$/, "").replace(/\.$/, "");
  if (withoutPort === "localhost") return withoutPort;
  return HOSTNAME_PATTERN.test(withoutPort) ? withoutPort : "";
};

export const getSubdomainMerchantCode = (
  hostname: string,
  platformRootDomain: string
): string | null => {
  const host = normalizeHostname(hostname);
  const root = normalizeHostname(platformRootDomain);
  if (!host || !root || host === root || !host.endsWith(`.${root}`)) return null;

  const prefix = host.slice(0, -(root.length + 1));
  if (!prefix || prefix.includes(".") || RESERVED_MERCHANT_CODES.has(prefix)) return null;
  return prefix;
};

export const getLocalMerchantCode = (
  hostname: string,
  fallbackCode: string
): string | null => {
  const host = normalizeHostname(hostname);
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return fallbackCode;
  }
  if (host.endsWith(".localhost")) {
    const code = host.slice(0, -".localhost".length);
    return code && !code.includes(".") && !RESERVED_MERCHANT_CODES.has(code)
      ? code
      : null;
  }
  return null;
};
