import AdminSidebar from "@/components/layout/AdminSidebar";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/backend/auth/authOptions";
import type { IUser } from "@/backend/models/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenantByHostname } from "@/backend/tenancy/tenantContext";
import { MerchantMember } from "@/backend/models/merchantIdentity";

interface Props {
  children: React.ReactNode;
}

const AdminLayout = async ({ children }: Props) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/admin/dashboard");
  const user = session.user as IUser;
  const requestHeaders = headers();
  const tenant = await resolveTenantByHostname(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost"
  );
  if (!tenant) redirect("/");
  const allowed = tenant.isLegacyFallback && user.role === "admin"
    ? true
    : Boolean(await MerchantMember.exists({
        merchantId: tenant.merchantId,
        userId: user._id,
        role: { $in: ["owner", "admin", "manager", "staff"] },
        status: "active",
      }));
  if (!allowed) redirect("/");

  return (
    <div className="admin-shell">
      <header className="dashboard-page-header">
        <div className="container">
          <span className="eyebrow">Operations</span>
          <h1>{tenant.name} dashboard</h1>
          <p>Manage inventory, bookings, customers, and performance.</p>
        </div>
      </header>
      <div className="container admin-shell-grid">
        <div className="row justify-content-between">
          <aside className="col-12 col-lg-3" aria-label="Admin navigation">
            <AdminSidebar />
          </aside>
          <div className="col-12 col-lg-9 admin-dashboard-content">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
