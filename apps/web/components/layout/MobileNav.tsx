"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function MobileNav() {
  const { ready, session } = useAuth();
  const items = [
    { href: "/", label: "Home" },
    { href: "/security", label: "Security" },
    { href: "/privacy", label: "Privacy" },
    { href: session && ready ? "/dashboard" : "/login", label: session && ready ? "Dashboard" : "Login" }
  ];

  return (
    <nav aria-label="Mobile" className="mobile-nav">
      {items.map((item) => (
        <Link className="mobile-nav-link" href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
