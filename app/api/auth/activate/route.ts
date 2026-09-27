import dbConnect from "@/backend/config/dbConnect";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { activateInvitation } from "@/backend/services/invitationService";
import { enforceRateLimit } from "@/backend/utils/rateLimit";
import { NextRequest, NextResponse } from "next/server";

const activate = catchAsyncErrors(async (request: NextRequest) => {
  const limited = enforceRateLimit(request, "auth:activate", { limit: 10, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;
  await dbConnect({ throwOnError: true });
  const body = await request.json();
  const result = await activateInvitation(body?.token, body?.password);
  return NextResponse.json({ success: true, ...result });
});

export async function POST(request: NextRequest) {
  return activate(request, {});
}

