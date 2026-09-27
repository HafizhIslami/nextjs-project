import dbConnect from "@/backend/config/dbConnect";
import { MerchantMember } from "@/backend/models/merchantIdentity";
import { requireUser } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const membership = tenant.isLegacyFallback && auth.role === "admin"
    ? { role: "owner", status: "active" }
    : await MerchantMember.findOne({
        merchantId: tenant.merchantId,
        userId: auth._id,
        status: "active",
      }).select({ role: 1, status: 1 }).lean().exec();
  return NextResponse.json({
    tenant: {
      merchantCode: tenant.merchantCode,
      name: tenant.name,
      currency: tenant.currency,
      locale: tenant.locale,
    },
    membership,
  });
}

export const dynamic = "force-dynamic";
