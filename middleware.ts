import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {},
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);

export const config = {
  matcher: ["/me/:path*", "/bookings/:path*", "/admin/:path*", "/platform/:path*"],
};
