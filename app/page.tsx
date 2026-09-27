import Home from "@/components/Home";
import ErrorPage from "./error";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantByHostname } from "@/backend/tenancy/tenantContext";
import { getStorefrontCatalog } from "@/backend/services/catalogService";
import StorefrontHome from "@/components/storefront/StorefrontHome";
import { getTenantForwardHeaders } from "@/helpers/serverTenantRequest";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find a room",
};

type SearchParams = Record<string, string | string[] | undefined>;

const getBaseUrl = () => {
  const requestHeaders = headers();
  const host = requestHeaders.get("host");

  if (process.env.NODE_ENV === "development" && host) {
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}`;
  }

  return process.env.API_URL;
};

const getRooms = async (searchParams: SearchParams = {}) => {
  const urlParams = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => urlParams.append(key, item));
    } else if (value) {
      urlParams.set(key, value);
    }
  });

  const queryString = urlParams.toString();

  try {
    const baseUrl = getBaseUrl();

    if (!baseUrl) {
      throw new Error("API_URL is not configured.");
    }

    const res = await fetch(`${baseUrl}/api/rooms?${queryString}`, {
      cache: "no-cache",
      headers: getTenantForwardHeaders(),
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON from /api/rooms, received ${contentType}`);
    }

    return await res.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, errMessage: message };
  }
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const requestHeaders = headers();
  const tenant = await resolveTenantByHostname(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost"
  );
  if (!tenant) notFound();

  const catalog = await getStorefrontCatalog(tenant, "retail");
  const defaultMerchantCode = process.env.DEFAULT_MERCHANT_CODE?.trim().toLowerCase() || "roomi";
  if (catalog && (catalog.offerings.length > 0 || tenant.merchantCode !== defaultMerchantCode)) {
    return <StorefrontHome tenant={tenant} catalog={catalog} />;
  }

  const data = await getRooms(searchParams);

  if (data?.errMessage) {
    return <ErrorPage error={data} />;
  }

  const hasFilters = ["location", "category", "guests"].some(
    (key) => searchParams[key] !== undefined
  );

  return <Home data={data} hasFilters={hasFilters} />;
}
