"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import { fetchAdminOverview } from "@/lib/api";

function AdminGate({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const { isAuthenticated, isLoading, token, user } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-lg border border-[var(--line)] bg-white px-6 py-20 text-center shadow-[var(--shadow)]">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">{title}</p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              {description}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || user?.role !== "admin" || !token) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-lg border border-[var(--line)] bg-white px-6 py-20 text-center shadow-[var(--shadow)]">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Admin access required
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              This back office is protected. Sign in with an admin account to manage orders, products, and inventory.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
              >
                Login
              </Link>
              <Link
                href="/products"
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
              >
                Browse storefront
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export function AdminDashboardPage() {
  const { token, user } = useAuth();
  const overviewQuery = useQuery({
    queryKey: ["admin-overview", token],
    queryFn: () => fetchAdminOverview(token ?? ""),
    enabled: Boolean(token && user?.role === "admin"),
  });

  return (
    <AdminGate
      title="Loading admin dashboard"
      description="Checking the authenticated role and pulling the current commerce operations overview."
    >
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
              Back office
            </div>
            <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Run the commerce operation from one back office.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
              Monitor orders, inventory, catalog health, payment state, and shipments from a compact operations surface.
            </p>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total orders", value: overviewQuery.data?.total_orders ?? "..." },
              { label: "Pending payment", value: overviewQuery.data?.pending_payment_orders ?? "..." },
              { label: "Low-stock variants", value: overviewQuery.data?.low_stock_variants ?? "..." },
              { label: "Shipments in progress", value: overviewQuery.data?.shipments_in_progress ?? "..." },
            ].map((card) => (
              <article key={card.label} className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  {card.label}
                </p>
                <p className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
                  {card.value}
                </p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {[
              {
                href: "/admin/orders",
                title: "Order operations",
                description: "Review pending payment, paid, fulfilled, and cancelled orders with payment visibility.",
              },
              {
                href: "/admin/inventory",
                title: "Inventory watch",
                description: "Scan stock on hand, reservations, low-stock pressure, and adjust variant inventory.",
              },
              {
                href: "/admin/products",
                title: "Catalog control",
                description: "Open the existing product editor to manage merchandising, variants, and seeded catalog data.",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  {item.description}
                </p>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </AdminGate>
  );
}
