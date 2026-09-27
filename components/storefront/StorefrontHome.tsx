import type { StorefrontCatalog } from "@/backend/services/catalogService";
import type { TenantContext } from "@/backend/tenancy/tenantContext";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import Image from "next/image";
import Link from "next/link";

const formatMoney = (amountMinor: number | undefined, currency: string, locale: string) => {
  if (amountMinor === undefined) return "Request a quote";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(currency === "IDR" ? amountMinor : amountMinor / 100);
};

const actionLabel = (type: string, purchasable: boolean) => {
  if (!purchasable || type === "custom") return "Request quote";
  if (type === "rental") return "View availability";
  if (type === "service") return "Schedule service";
  return "View product";
};

export default function StorefrontHome({
  tenant,
  catalog,
}: {
  tenant: TenantContext;
  catalog: StorefrontCatalog;
}) {
  return (
    <div className="merchant-storefront">
      <section className="merchant-hero">
        <div className="container merchant-hero-content">
          <span className="eyebrow">{catalog.channel.name}</span>
          <h1>{tenant.name}</h1>
          <p>Explore products and services selected for you.</p>
          <a href="#catalog" className="btn btn-primary-roomi">Browse catalog</a>
        </div>
      </section>

      <section id="catalog" className="container rooms-section" aria-labelledby="catalog-title">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Catalog</span>
            <h2 id="catalog-title" className="stays-heading">Available now</h2>
          </div>
          {catalog.channel.type === "retail" && (
            <Link href="/reseller" className="text-link">Reseller access</Link>
          )}
        </div>

        {catalog.offerings.length === 0 ? (
          <div className="empty-state" role="status">
            <h3>Catalog is being prepared</h3>
            <p>Please check back soon for new products and services.</p>
          </div>
        ) : (
          <div className="merchant-product-grid">
            {catalog.offerings.map((offering) => (
              <article className="merchant-product-card" key={offering.id}>
                <div className="merchant-product-media">
                  <Image
                    src={normalizeImageUrl(offering.media[0]?.url, "/images/default_room_image.jpg")}
                    alt={offering.media[0]?.alt || offering.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <span className="merchant-product-type">{offering.type}</span>
                </div>
                <div className="merchant-product-body">
                  <p className="merchant-product-code">{offering.code}</p>
                  <h3>{offering.name}</h3>
                  <p>{offering.shortDescription || offering.description}</p>
                  <div className="merchant-product-footer">
                    <strong>{formatMoney(offering.price.amountMinor, offering.price.currency, tenant.locale)}</strong>
                    <Link href={`/products/${offering.slug}`} className="text-link">
                      {actionLabel(offering.type, offering.purchasable)}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
