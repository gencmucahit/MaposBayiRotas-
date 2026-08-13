"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const allLinks = [
  { href: "/", label: "Harita" },
  { href: "/isletmeler", label: "İşletmeler" },
  { href: "/rota", label: "Rota Oluştur" },
];

export function NavBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const links = isAuthenticated
    ? allLinks
    : allLinks.filter((link) => link.href === "/");

  return (
    <nav className="flex flex-nowrap items-center gap-1">
      {links.map((link) => {
        const isActive =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
              isActive
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
