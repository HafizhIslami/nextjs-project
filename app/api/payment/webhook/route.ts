import { webhookCheckout } from "@/backend/controllers/paymentControllers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return webhookCheckout(request);
}
