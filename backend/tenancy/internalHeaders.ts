import crypto from "node:crypto";
import { normalizeHostname } from "./hostname";

const getSecret = () => process.env.TENANT_INTERNAL_SECRET || process.env.NEXTAUTH_SECRET || "";

export const signTenantHostname = (rawHostname: string): string => {
  const hostname = normalizeHostname(rawHostname);
  const secret = getSecret();
  if (!hostname || !secret) return "";
  return crypto.createHmac("sha256", secret).update(hostname).digest("hex");
};

export const verifyTenantHostnameSignature = (
  rawHostname: string | null,
  signature: string | null
): string | null => {
  const hostname = normalizeHostname(rawHostname);
  const expected = signTenantHostname(hostname);
  if (!hostname || !signature || !expected) return null;
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length) return null;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer) ? hostname : null;
};
