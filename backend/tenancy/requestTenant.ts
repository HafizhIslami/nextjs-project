import { NextRequest } from "next/server";
import ErrorHandler from "../utils/errorHandler";
import { resolveTenantFromRequest, type TenantContext } from "./tenantContext";

export const requireTenantContext = async (
  request: NextRequest
): Promise<TenantContext> => {
  const tenant = await resolveTenantFromRequest(request);
  if (!tenant) {
    throw new ErrorHandler("Merchant website was not found for this hostname", 404);
  }
  return tenant;
};
