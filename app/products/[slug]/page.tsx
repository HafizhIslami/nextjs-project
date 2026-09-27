import { getStorefrontOffering } from "@/backend/services/catalogService";
import { resolveTenantByHostname } from "@/backend/tenancy/tenantContext";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PurchasePanel from "@/components/storefront/PurchasePanel";

const getTenant = async () => {
  const requestHeaders = headers();
  return resolveTenantByHostname(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost"
  );
};

const formatMoney = (amountMinor: number | undefined, currency: string, locale: string) => {
  if (amountMinor === undefined) return "Request a quote";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(currency === "IDR" ? amountMinor : amountMinor / 100);
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return {};
  const offering = await getStorefrontOffering(tenant, params.slug);
  return offering
    ? { title: offering.name, description: offering.shortDescription || offering.description.slice(0, 160) }
    : {};
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenant();
  if (!tenant) notFound();
  const offering = await getStorefrontOffering(tenant, params.slug);
  if (!offering) notFound();

  return (
    <article className="container merchant-detail">
      <Link href="/" className="text-link merchant-detail-back">← Back to catalog</Link>
      <div className="merchant-detail-grid">
        <div className="merchant-detail-media">
          <Image
            src={normalizeImageUrl(offering.media[0]?.url, "/images/default_room_image.jpg")}
            alt={offering.media[0]?.alt || offering.name}
            fill
            priority
            sizes="(max-width: 991px) 100vw, 55vw"
          />
        </div>
        <div className="merchant-detail-copy">
          <span className="eyebrow">{offering.type}</span>
          <h1>{offering.name}</h1>
          <p className="merchant-detail-code">{offering.code}</p>
          <p>{offering.description}</p>
          <strong className="merchant-detail-price">
            {formatMoney(offering.price.amountMinor, offering.price.currency, tenant.locale)}
          </strong>
          <PurchasePanel
            offeringId={offering.id}
            offeringType={offering.type}
            pricingModel={offering.price.model}
            minimumQuantity={offering.minimumQuantity}
            purchasable={offering.purchasable}
          />
          {offering.minimumQuantity > 1 && (
            <small>Minimum order: {offering.minimumQuantity}</small>
          )}
        </div>
      </div>
    </article>
  );
}
