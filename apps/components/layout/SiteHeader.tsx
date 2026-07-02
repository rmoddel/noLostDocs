"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { assetPaths } from "@/constants/assets";
import { Button } from "../ui/Button";
import { MobileNav } from "./MobileNav";

const navItems = [
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, session, signOut } = useAuth();
  const showDashboardButton = ready && session && pathname !== "/dashboard";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link aria-label="NoLostDocs home" className="brand-link" href="/">
          <Image
            alt="NoLostDocs"
            className="brand-image"
            height={52}
            priority
            src={assetPaths.logos.navbar}
            width={232}
          />
        </Link>
        <nav aria-label="Primary" className="site-nav">
          {navItems.map((item) => (
            <Link className="site-nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header-actions">
          {ready && session ? (
            <>
              {showDashboardButton ? (
                <Button href="/dashboard" size="sm" variant="secondary">
                  Dashboard
                </Button>
              ) : null}
              <Button
                onClick={() => {
                  void signOut();
                  router.push("/");
                }}
                size="sm"
              >
                Sign out
              </Button>
            </>
          ) : (
              <Button href="/login" size="sm">
                Login
              </Button>
          )}
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
