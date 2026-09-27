"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { name: "Overview", url: "/platform" },
  { name: "Merchants", url: "/platform/merchants" },
  { name: "Create merchant", url: "/platform/merchants/new" },
  { name: "Audit log", url: "/platform/audit-logs" },
];

export default function PlatformSidebar() {
  const pathname = usePathname();
  return (
    <nav className="platform-sidebar" aria-label="Platform sections">
      <div className="platform-sidebar-label">Platform console</div>
      {items.map((item) => {
        const active = item.url === "/platform"
          ? pathname === item.url
          : pathname.startsWith(item.url);
        return (
          <Link key={item.url} href={item.url} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

