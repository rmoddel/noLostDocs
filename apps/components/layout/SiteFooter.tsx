"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { assetPaths } from "@/constants/assets";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" }
];

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Image
          alt="NoLostDocs slogan"
          className="footer-slogan"
          height={64}
          src={assetPaths.slogan.transparent}
          width={480}
        />
        <p className="footer-copy">
          NoLostDocs is a client-facing records platform for households and professionals who need a more reliable way to store, recover, and review critical files.
        </p>
        <p className="footer-meta">
          The web experience is built around explicit cloud-backed access, recovery-capable account controls, and practical security boundaries for sensitive records.
        </p>
        <div className="footer-links">
          {footerLinks.map((item) => (
            <Link className="footer-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
