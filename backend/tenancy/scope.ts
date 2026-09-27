import mongoose from "mongoose";
import type { TenantContext } from "./tenantContext";

type TenantQuery = Record<string, unknown>;

export const tenantFilter = (
  tenant: TenantContext,
  filter: TenantQuery = {}
): TenantQuery => {
  if (tenant.isLegacyFallback) {
    return {
      $and: [
        filter,
        {
          $or: [
            { merchantId: tenant.merchantId },
            { merchantId: { $exists: false } },
            { merchantId: null },
          ],
        },
      ],
    };
  }

  return { ...filter, merchantId: tenant.merchantId };
};

export const tenantAggregateMatch = (tenant: TenantContext): TenantQuery => {
  const merchantId = new mongoose.Types.ObjectId(tenant.merchantId);
  return tenant.isLegacyFallback
    ? { $or: [{ merchantId }, { merchantId: { $exists: false } }, { merchantId: null }] }
    : { merchantId };
};
