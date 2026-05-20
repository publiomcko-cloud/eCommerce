"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth, useCart } from "@/app/providers";

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { itemCount } = useCart();
  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: `Cart${itemCount > 0 ? ` (${itemCount})` : ""}` },
    { href: "/orders/new", label: "Add Test Order" },
    ...(user?.role === "admin" ? [{ href: "/admin/products", label: "Admin Products" }] : []),
    ...(isAuthenticated ? [{ href: "/account", label: "Account" }] : []),
    ...(!isAuthenticated ? [{ href: "/login", label: "Login" }, { href: "/register", label: "Register" }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="glass-panel mx-auto flex max-w-7xl flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
            DataPulse BI
          </Link>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Analytics dashboard, seeded catalog browsing, and the first commerce admin foundation.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--foreground)" : "rgba(255, 255, 255, 0.55)",
                  color: isActive ? "var(--background)" : "var(--foreground)",
                  border: isActive ? "none" : "1px solid var(--line)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/50"
            >
              Logout
            </button>
          ) : null}
          {isLoading ? (
            <span className="self-center px-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Loading auth
            </span>
          ) : user ? (
            <span className="self-center px-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              {user.role}
            </span>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
