"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/try-on", label: "Try It On" },
  { href: "/street", label: "Shop The Look" },
  { href: "/size", label: "Find My Size" },
  { href: "/body-scan", label: "Body Scan" },
] as const;

function navLinkClass(href: string, pathname: string) {
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  const base =
    "px-3 py-2 text-xs uppercase tracking-[0.2em] transition-colors sm:px-4 sm:text-[11px] sm:tracking-[0.22em]";
  if (isActive) {
    return `${base} font-bold text-white underline decoration-[#FF2800] decoration-2 underline-offset-[6px]`;
  }
  return `${base} font-normal text-[rgba(255,255,255,0.7)] hover:font-bold hover:text-white`;
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <nav
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-1 gap-y-2 px-4 py-3.5 sm:gap-x-2"
        aria-label="Main"
      >
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className={navLinkClass(href, pathname)}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
