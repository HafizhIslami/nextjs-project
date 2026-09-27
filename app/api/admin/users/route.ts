import { allAdminUsers } from "@/backend/controllers/authControllers";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return await allAdminUsers(request, {});
}
export const dynamic = "force-dynamic";
