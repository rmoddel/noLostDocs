import Image from "next/image";
import Link from "next/link";
import { assetPaths } from "@/constants/assets";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" }
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
          Cloud-backed document organization for people who need a calmer way to store, recover, and review the records that matter.
        </p>
        <p className="footer-meta">
          Runtime assets now resolve from the live app only. Archive exports stay separate until the naming cleanup phase.
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
