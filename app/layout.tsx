import "bootstrap/dist/css/bootstrap.css";

import "./globals.css";
import "./design-system.css";
import type { Metadata } from "next";
import { GlobalProvider } from "./GlobalProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Roomi - Find a stay that feels right",
    template: "%s | Roomi",
  },
  description:
    "Discover comfortable rooms, compare essential amenities, and book your stay with Roomi.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <GlobalProvider>
          <Header />
          <main id="main-content" className="site-main">
            {children}
          </main>
          <Footer />
        </GlobalProvider>
      </body>
    </html>
  );
}
