import Link from "next/link";
import Image from "next/image";
import type { TenantContext } from "@/backend/tenancy/tenantContext";
import roomiFooter from "../../public/images/roomi_footer.png";

const Footer = ({ tenant }: { tenant?: TenantContext }) => {
  const name = tenant?.name || "Roomi";
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div>
          {tenant?.branding.logoUrl ? (
            <Image
              src={tenant.branding.logoUrl}
              alt={`${name} logo`}
              width={250}
              height={96}
              className="footer-logo"
            />
          ) : tenant ? (
            <span className="footer-wordmark">{name}</span>
          ) : (
            <Image
              src={roomiFooter}
              alt="Roomi logo"
              width={250}
              height={135}
              className="footer-logo"
            />
          )}
          <p>Products and services, clearly presented.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/">Browse catalog</Link>
          <Link href="/login">Log in</Link>
          <Link href="/register">Create account</Link>
        </nav>
        <p className="footer-copyright">
          (c) {new Date().getFullYear()} {name}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
