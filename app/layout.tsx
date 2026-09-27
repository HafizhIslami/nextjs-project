import "bootstrap/dist/css/bootstrap.css";

import "./globals.css";
import "./design-system.css";
import type { Metadata } from "next";
import { GlobalProvider } from "./GlobalProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { headers } from "next/headers";
import { resolveTenantByHostname } from "@/backend/tenancy/tenantContext";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const getLayoutTenant = async () => {
  const requestHeaders = headers();
  return resolveTenantByHostname(
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost"
  );
};

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getLayoutTenant();
  const name = tenant?.name || "Roomi";
  return {
    title: { default: `${name} - Products and services`, template: `%s | ${name}` },
    description: `Explore products and services from ${name}.`,
    icons: tenant?.branding.faviconUrl ? { icon: tenant.branding.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getLayoutTenant();
  if (!tenant) notFound();
  const merchantStyles = {
    "--merchant-primary": tenant?.branding.primaryColor || "#a7194b",
    "--merchant-secondary": tenant?.branding.secondaryColor || "#23191f",
    "--merchant-accent": tenant?.branding.accentColor || "#f6dce6",
    "--roomi-brand-700": tenant?.branding.primaryColor || "#9d174d",
    "--roomi-brand-800": tenant?.branding.primaryColor || "#7e173b",
    "--roomi-brand-900": tenant?.branding.secondaryColor || "#67112f",
    "--roomi-brand-50": tenant?.branding.accentColor || "#fff3f7",
    "--roomi-brand-100": tenant?.branding.accentColor || "#ffe4ec",
    "--roomi-ink": tenant?.branding.secondaryColor || "#19151a",
    ...(tenant?.branding.fontFamily
      ? { "--merchant-font": tenant.branding.fontFamily }
      : {}),
  } as CSSProperties;

  return (
    <html lang={tenant?.locale?.split("-")[0] || "id"}>
      <body style={merchantStyles}>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <GlobalProvider>
          <Header tenant={tenant} />
          <main id="main-content" className="site-main">
            {children}
          </main>
          <Footer tenant={tenant} />
        </GlobalProvider>
      </body>
    </html>
  );
}
