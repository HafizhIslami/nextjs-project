import { getStorefrontOffering } from "@/backend/services/catalogService";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import ErrorHandler from "@/backend/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

const getOffering = catchAsyncErrors(
  async (request: NextRequest, { params }: { params: { slug: string } }) => {
    const tenant = await requireTenantContext(request);
    const offering = await getStorefrontOffering(tenant, params.slug, "retail");
    if (!offering) throw new ErrorHandler("Offering not found", 404);
    return NextResponse.json({ offering });
  }
);

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } }
): Promise<NextResponse> {
  return getOffering(request, context);
}

export const dynamic = "force-dynamic";
