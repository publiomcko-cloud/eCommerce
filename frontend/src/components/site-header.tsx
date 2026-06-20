"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth, useCart } from "@/app/providers";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { itemCount } = useCart();
  const isAdmin = user?.role === "admin";
  const navItems = [
    { href: "/", label: "Store" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart", badge: itemCount > 0 ? String(itemCount) : null },
    ...(isAuthenticated ? [{ href: "/account", label: "Account" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }, { href: "/dashboard", label: "Analytics" }] : []),
    ...(!isAuthenticated ? [{ href: "/login", label: "Login" }, { href: "/register", label: "Register" }] : []),
  ];
  const adminNavItems = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/dashboard", label: "Analytics" },
  ];
  const showAdminSubnav = isAdmin && (pathname.startsWith("/admin") || pathname === "/dashboard");

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-lg border border-[var(--line)] bg-white/95 shadow-[0_10px_30px_rgba(29,39,33,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
              DataPulse Commerce
            </Link>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Storefront, checkout, admin operations, and commerce analytics.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--foreground)" : "white",
                    color: isActive ? "white" : "var(--foreground)",
                    border: isActive ? "1px solid var(--foreground)" : "1px solid var(--line)",
                  }}
                >
                  <span>{item.label}</span>
                  {"badge" in item && item.badge ? (
                    <span
                      className="grid min-h-5 min-w-5 place-items-center rounded-full px-1 text-xs"
                      style={{
                        backgroundColor: isActive ? "rgba(255,255,255,0.18)" : "var(--teal-soft)",
                        color: isActive ? "white" : "var(--teal)",
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-[var(--foreground)]"
              >
                Logout
              </button>
            ) : null}
            {isLoading ? (
              <span className="self-center px-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Loading auth
              </span>
            ) : user ? (
              <span className="self-center rounded-full bg-[var(--background)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                {user.role}
              </span>
            ) : null}
          </nav>
        </div>

        {showAdminSubnav ? (
          <nav className="flex gap-2 overflow-x-auto border-t border-[var(--line)] bg-[var(--background)] px-5 py-3">
            {adminNavItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: isActive ? "var(--teal)" : "white",
                    color: isActive ? "white" : "var(--foreground)",
                    border: isActive ? "1px solid var(--teal)" : "1px solid var(--line)",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
