import { headers } from "next/headers";
import { normalizeHostname } from "@/backend/tenancy/hostname";
import { signTenantHostname } from "@/backend/tenancy/internalHeaders";

export const getServerApiUrl = (path: string): string => {
  const apiUrl = process.env.API_URL?.replace(/\/$/, "");
  if (!apiUrl) throw new Error("API_URL is not configured");
  return `${apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getTenantForwardHeaders = (): Record<string, string> => {
  const requestHeaders = headers();
  const hostname = normalizeHostname(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost"
  );
  const signature = signTenantHostname(hostname);
  return signature
    ? { "x-roomi-tenant-host": hostname, "x-roomi-tenant-signature": signature }
    : {};
};
