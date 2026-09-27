import { NextRequest } from "next/server";
import { isPlatformHostname } from "./host";
import { NextResponse } from "next/server";

export const requirePlatformHostname = (request: NextRequest) => {
  const hostname =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!isPlatformHostname(hostname)) {
    return NextResponse.json(
      { errMessage: "Platform console is not available on a merchant hostname" },
      { status: 404 }
    );
  }
  return null;
};
