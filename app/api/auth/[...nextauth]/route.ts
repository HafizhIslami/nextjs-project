import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { enforceRateLimit } from "@/backend/utils/rateLimit";
import { authOptions } from "@/backend/auth/authOptions";

type RouteHandlerContext = {
  params: { nextauth: string[] } | Promise<{ nextauth: string[] }>;
};

const configuredLoginLimit = Number.parseInt(
  process.env.AUTH_LOGIN_RATE_LIMIT ?? "10",
  10
);
const loginRateLimit = Number.isFinite(configuredLoginLimit)
  ? Math.min(Math.max(configuredLoginLimit, 10), 1000)
  : 10;

async function auth(req: NextRequest, res: RouteHandlerContext) {
  if (
    req.method === "POST" &&
    req.nextUrl.pathname.endsWith("/callback/credentials")
  ) {
    const rateLimitResponse = enforceRateLimit(req, "auth:login", {
      limit: loginRateLimit,
      windowMs: 15 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;
  }

  return await NextAuth(req, res, authOptions);
}

export { auth as GET, auth as POST };
export const dynamic = "force-dynamic";
