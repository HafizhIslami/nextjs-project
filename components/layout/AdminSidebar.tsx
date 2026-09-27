"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const AdminSidebar = () => {
  const pathName = usePathname();
  const menuItem = [
    {
      name: "Dashboard",
      url: "/admin/dashboard",
    },
    {
      name: "Rooms",
      url: "/admin/rooms",
    },
    {
      name: "Offerings",
      url: "/admin/offerings",
    },
    {
      name: "Bookings",
      url: "/admin/bookings",
    },
    {
      name: "Orders",
      url: "/admin/orders",
    },
    {
      name: "Users",
      url: "/admin/users",
    },
    {
      name: "Customers",
      url: "/admin/customers",
    },
    {
      name: "Reviews",
      url: "/admin/reviews",
    },
    {
      name: "Merchant settings",
      url: "/admin/settings",
    },
  ];

  return (
    <nav className="list-group dashboard-nav" aria-label="Admin sections">
      {menuItem.map((item) => (
        <Link
          key={item.url}
          href={item.url}
          className={`fw-bold list-group-item list-group-item-action ${
            pathName.includes(item.url) ? "active" : ""
          }`}
          aria-current={pathName.includes(item.url) ? "page" : undefined}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default AdminSidebar;
