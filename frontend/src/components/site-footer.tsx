"use client";

import Link from "next/link";

import { useAuth } from "@/app/providers";

export function SiteFooter() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const links = [
    { href: "/", label: "Store" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart" },
    ...(isAuthenticated ? [{ href: "/account", label: "Account" }] : [{ href: "/login", label: "Login" }]),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }, { href: "/dashboard", label: "Analytics" }] : []),
  ];

  return (
    <footer className="px-4 pb-8 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)] md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">
            DataPulse Commerce
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            Portfolio demo using synthetic data and mock payments only. No real card data is collected.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 md:justify-end">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition hover:border-[var(--foreground)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
