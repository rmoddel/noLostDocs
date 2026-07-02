"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function MobileNav() {
  const pathname = usePathname();
  const { ready, session } = useAuth();
  const [open, setOpen] = useState(false);

  const authLink = ready && session ? { href: "/dashboard", label: "Records" } : { href: "/login", label: "Login" };

  const items = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/security", label: "Security" },
      { href: "/privacy", label: "Privacy" },
      { href: "/contact", label: "Contact" },
      authLink
    ],
    [authLink]
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav aria-label="Mobile" className={`mobile-nav${open ? " open" : ""}`}>
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="mobile-nav-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="mobile-nav-toggle-icon" aria-hidden="true">
          <svg className="mobile-nav-toggle-menu" fill="none" viewBox="0 0 24 24">
            <path d="M5 7.5h14" />
            <path d="M5 12h14" />
            <path d="M5 16.5h14" />
          </svg>
          <svg className="mobile-nav-toggle-close" fill="none" viewBox="0 0 24 24">
            <path d="M6 6 18 18" />
            <path d="M18 6 6 18" />
          </svg>
        </span>
      </button>

      <div className="mobile-nav-panel">
        {items.map((item) => (
          <Link className="mobile-nav-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
