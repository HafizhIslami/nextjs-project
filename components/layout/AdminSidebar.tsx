"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const AdminSidebar = () => {
  const pathName = usePathname();
  const menuItem = [
    {
      name: "Dashboard",
      url: "/admin/dashboard",
      icon: "fas fa-tachometer-alt",
    },
    {
      name: "Rooms",
      url: "/admin/rooms",
      icon: "fas fa-hotel",
    },
    {
      name: "Bookings",
      url: "/admin/bookings",
      icon: "fas fa-receipt",
    },
    {
      name: "Users",
      url: "/admin/users",
      icon: "fas fa-user",
    },
    {
      name: "Reviews",
      url: "/admin/reviews",
      icon: "fas fa-star",
    },
  ];

  const [activeMenuItem, setActiveMenuItem] = useState(pathName);

  const handleMenuItemClick = (name: string) => {
    setActiveMenuItem(name);
  };

  return (
    <div className="list-group mt-5 pl-4">
      {menuItem.map((item, index) => (
        <Link
          key={index}
          href={item.url}
          className={`fw-bold list-group-item list-group-item-action ${
            activeMenuItem.includes(item.url) ? "active" : ""
          }`}
          onClick={() => handleMenuItemClick(item.url)}
          aria-current={activeMenuItem.includes(item.url) ? "true" : "false"}
        >
          <i className={`${item.icon} fa-fw pe-2`}></i>
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default AdminSidebar;
