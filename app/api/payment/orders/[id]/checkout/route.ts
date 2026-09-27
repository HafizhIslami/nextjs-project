import { orderCheckoutSession } from "@/backend/controllers/paymentControllers";
import { requireUser } from "@/backend/middlewares/routeAuth";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: { id: string } };

export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  return orderCheckoutSession(request, context);
}

export const dynamic = "force-dynamic";
