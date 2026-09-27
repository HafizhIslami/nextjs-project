import dbConnect from "@/backend/config/dbConnect";
import { PlatformMember } from "@/backend/models/platform";
import type { IUser } from "@/backend/models/user";
import { authOptions } from "@/backend/auth/authOptions";
import { isPlatformHostname } from "@/backend/platform/host";
import PlatformSidebar from "@/components/platform/PlatformSidebar";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = headers();
  const hostname = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  if (!isPlatformHostname(hostname)) notFound();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/platform");
  await dbConnect({ throwOnError: true });
  const user = session.user as IUser;
  const membership = await PlatformMember.findOne({ userId: user._id, status: "active" }).select({ role: 1 }).lean().exec();
  if (!membership) redirect("/");
  return <div className="platform-shell"><header className="platform-header"><div className="container"><span className="eyebrow">Roomi control plane</span><h1>Platform operations</h1><p>Provision and govern every merchant from one deployment.</p></div></header><div className="container platform-layout"><aside><PlatformSidebar /></aside><main id="platform-content">{children}</main></div></div>;
}

