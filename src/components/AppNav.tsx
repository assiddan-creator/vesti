"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function linkClass(href: string, pathname: string) {
  const isActive = pathname === href;
  const base =
    "px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all border";
  return isActive
    ? `${base} border-[#FF2800] text-white`
    : `${base} border-white/20 text-white/70 hover:text-white hover:border-[#FF2800]/50`;
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-wrap justify-center gap-2 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-sm">
      <Link href="/" className={linkClass("/", pathname)}>
        Home
      </Link>
      <Link href="/try-on" className={linkClass("/try-on", pathname)}>
        👗 Try It On
      </Link>
      <Link href="/street" className={linkClass("/street", pathname)}>
        🔍 Shop The Look
      </Link>
      <Link href="/size" className={linkClass("/size", pathname)}>
        📏 Find My Size
      </Link>
      <Link href="/body-scan" className={linkClass("/body-scan", pathname)}>
        📷 Body Scan
      </Link>
    </nav>
  );
}
