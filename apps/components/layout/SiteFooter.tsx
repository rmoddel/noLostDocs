"use client";

import Image from "next/image";
import Link from "next/link";
import { assetPaths } from "@/constants/assets";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Sign in" }
];

export function SiteFooter() {
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
          NoLostDocs is a records platform for households and professionals who need a reliable way to store, recover, and review critical files.
        </p>
        <p className="footer-meta">
          The web experience is cloud-backed, account-controlled, and built for sensitive records.
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
