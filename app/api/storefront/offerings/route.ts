import { getStorefrontCatalog } from "@/backend/services/catalogService";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { NextRequest, NextResponse } from "next/server";

const listOfferings = catchAsyncErrors(async (request: NextRequest) => {
  const tenant = await requireTenantContext(request);
  const catalog = await getStorefrontCatalog(tenant, "retail");
  return NextResponse.json({ tenant, catalog });
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  return listOfferings(request, {});
}

export const dynamic = "force-dynamic";
