import { NextRequest } from "next/server";
import dbConnect from "../config/dbConnect";
import Merchant, { MerchantDomain } from "../models/merchant";
import type { IMerchant } from "../models/merchant";
import {
  getLocalMerchantCode,
  getSubdomainMerchantCode,
  normalizeHostname,
} from "./hostname";
import { verifyTenantHostnameSignature } from "./internalHeaders";

export const DEFAULT_MERCHANT_ID = "000000000000000000000001";

export type TenantContext = {
  merchantId: string;
  merchantCode: string;
  name: string;
  hostname: string;
  primaryHostname: string;
  currency: string;
  locale: string;
  timezone: string;
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily?: string;
  };
  enabledModules: string[];
  isLegacyFallback: boolean;
};

const defaultCode = () => process.env.DEFAULT_MERCHANT_CODE?.trim().toLowerCase() || "roomi";

export const getRequestHostname = (request: NextRequest): string => {
  const internalHostname = verifyTenantHostnameSignature(
    request.headers.get("x-roomi-tenant-host"),
    request.headers.get("x-roomi-tenant-signature")
  );
  return internalHostname || normalizeHostname(
    request.headers.get("x-forwarded-host") || request.headers.get("host")
  );
};

const legacyFallback = (hostname: string): TenantContext => ({
  merchantId: process.env.DEFAULT_MERCHANT_ID || DEFAULT_MERCHANT_ID,
  merchantCode: defaultCode(),
  name: "Roomi",
  hostname,
  primaryHostname: hostname,
  currency: "IDR",
  locale: "id-ID",
  timezone: "Asia/Jakarta",
  branding: {
    primaryColor: "#a7194b",
    secondaryColor: "#23191f",
    accentColor: "#f6dce6",
  },
  enabledModules: ["catalog", "commerce", "rental"],
  isLegacyFallback: true,
});

const serializeTenant = (
  merchant: Pick<
    IMerchant,
    "_id" | "merchantCode" | "name" | "settings" | "branding" | "enabledModules"
  >,
  hostname: string,
  primaryHostname: string
): TenantContext => ({
  merchantId: merchant._id.toString(),
  merchantCode: merchant.merchantCode,
  name: merchant.name,
  hostname,
  primaryHostname,
  currency: merchant.settings?.currency || "IDR",
  locale: merchant.settings?.locale || "id-ID",
  timezone: merchant.settings?.timezone || "Asia/Jakarta",
  branding: {
    logoUrl: merchant.branding?.logoUrl,
    faviconUrl: merchant.branding?.faviconUrl,
    primaryColor: merchant.branding?.primaryColor || "#a7194b",
    secondaryColor: merchant.branding?.secondaryColor || "#23191f",
    accentColor: merchant.branding?.accentColor || "#f6dce6",
    fontFamily: merchant.branding?.fontFamily,
  },
  enabledModules: merchant.enabledModules || [],
  isLegacyFallback: false,
});

export const resolveTenantByHostname = async (
  rawHostname: string | null | undefined
): Promise<TenantContext | null> => {
  const hostname = normalizeHostname(rawHostname);
  if (!hostname) return null;

  const localCode = getLocalMerchantCode(hostname, defaultCode());
  const platformCode = getSubdomainMerchantCode(
    hostname,
    process.env.PLATFORM_ROOT_DOMAIN || "roomi.local"
  );
  const platformRoot = normalizeHostname(
    process.env.PLATFORM_ROOT_DOMAIN || "roomi.local"
  );

  try {
    await dbConnect({ throwOnError: true });

    const domain = await MerchantDomain.findOne({ hostname, status: "active" })
      .select({ merchantId: 1 })
      .lean()
      .exec();

    let merchant = domain
      ? await Merchant.findOne({ _id: domain.merchantId, status: "active" }).lean().exec()
      : null;

    const code = localCode || platformCode || (hostname === platformRoot ? defaultCode() : null);
    if (!merchant && code) {
      merchant = await Merchant.findOne({ merchantCode: code, status: "active" }).lean().exec();
    }

    if (merchant) {
      const primaryDomain = await MerchantDomain.findOne({
        merchantId: merchant._id,
        isPrimary: true,
        status: "active",
      })
        .select({ hostname: 1 })
        .lean()
        .exec();
      return serializeTenant(merchant, hostname, primaryDomain?.hostname || hostname);
    }
  } catch (error) {
    if (!localCode) throw error;
  }

  // Existing Roomi data can run before the migration script creates its tenant.
  return (localCode === defaultCode() || hostname === platformRoot)
    ? legacyFallback(hostname)
    : null;
};

export const resolveTenantFromRequest = (request: NextRequest) =>
  resolveTenantByHostname(getRequestHostname(request));
