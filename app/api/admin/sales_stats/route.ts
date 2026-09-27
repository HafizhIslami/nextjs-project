import { getSalesStats } from "@/backend/controllers/bookingControllers";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return await getSalesStats(request, {});
}
export const dynamic = "force-dynamic";
