"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/orders/new", label: "Add Test Order" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="glass-panel mx-auto flex max-w-7xl flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
            DataPulse BI
          </Link>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Analytics dashboard and manual order sandbox for pipeline testing.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
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
        </nav>
      </div>
    </header>
  );
}
