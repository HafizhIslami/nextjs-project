import { authOptions } from "@/backend/auth/authOptions";
import { Channel } from "@/backend/models/catalog";
import { Customer } from "@/backend/models/merchantIdentity";
import type { IUser } from "@/backend/models/user";
import { getStorefrontCatalog } from "@/backend/services/catalogService";
import { resolveTenantByHostname } from "@/backend/tenancy/tenantContext";
import ResellerApplication from "@/components/storefront/ResellerApplication";
import StorefrontHome from "@/components/storefront/StorefrontHome";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata = { title: "Reseller access" };

export default async function ResellerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/reseller");
  const user = session.user as IUser;
  const requestHeaders = headers();
  const tenant = await resolveTenantByHostname(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost"
  );
  if (!tenant) notFound();

  const channel = await Channel.findOne({ merchantId: tenant.merchantId, code: "reseller", status: "active" })
    .select({ _id: 1 })
    .lean()
    .exec();
  if (!channel) notFound();
  const customer = await Customer.findOne({ merchantId: tenant.merchantId, userId: user._id }).lean().exec();
  const approved = Boolean(
    customer?.reseller?.approved &&
    customer.channelIds.some((id: { toString(): string }) => id.toString() === channel._id.toString())
  );
  if (!approved) {
    return (
      <div className="container reseller-access-page">
        <ResellerApplication requested={Boolean(customer?.reseller?.requested)} />
      </div>
    );
  }

  const catalog = await getStorefrontCatalog(tenant, "reseller");
  if (!catalog) notFound();
  return <StorefrontHome tenant={tenant} catalog={catalog} />;
}
