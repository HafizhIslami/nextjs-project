import Link from "next/link";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-content">
        <div>
          <img src="/images/roomi_footer.png" alt="Roomi Logo" width="250" height="135" />
          <p>Comfortable stays, clearly presented.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/search">Find a room</Link>
          <Link href="/login">Log in</Link>
          <Link href="/register">Create account</Link>
        </nav>
        <p className="footer-copyright">
          (c) {new Date().getFullYear()} Roomi
        </p>
      </div>
    </footer>
  );
};

export default Footer;
