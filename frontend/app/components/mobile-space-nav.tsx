"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { href: "/space", label: "Home", mark: "⌂" },
  { href: "/space/beans", label: "Beans", mark: "◒" },
  { href: "/space/brews", label: "Journal", mark: "＋" },
  { href: "/space/taste", label: "Taste", mark: "◇" },
  { href: "/space/world", label: "World", mark: "◎" },
] as const;

export function MobileSpaceNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-space-nav" aria-label="Coffee Space">
      {destinations.map(({ href, label, mark }) => {
        const active = href === "/space" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            <span aria-hidden="true">{mark}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
