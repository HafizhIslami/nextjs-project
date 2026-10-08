import Link from "next/link";
import React from "react";

const NotFound = () => {
  return (
    <section className="feedback-page">
      <div className="feedback-card">
          <span className="eyebrow">404 error</span>
          <h1>That page is not available</h1>
          <p>The link may be outdated, or the page may have moved.</p>
          <Link href="/" className="btn btn-primary-roomi">
            Return home
          </Link>
      </div>
    </section>
  );
};

export default NotFound;
