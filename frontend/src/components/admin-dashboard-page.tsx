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
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
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
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
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
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
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
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <section className="glass-panel rounded-[40px] p-6 sm:p-8">
            <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
              Stage 7 admin
            </div>
            <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Run the commerce operation from one back office.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
              The admin area now spans product management, low-stock monitoring, order handling, payment visibility, and
              shipment state representation.
            </p>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total orders", value: overviewQuery.data?.total_orders ?? "..." },
              { label: "Pending payment", value: overviewQuery.data?.pending_payment_orders ?? "..." },
              { label: "Low-stock variants", value: overviewQuery.data?.low_stock_variants ?? "..." },
              { label: "Shipments in progress", value: overviewQuery.data?.shipments_in_progress ?? "..." },
            ].map((card) => (
              <article key={card.label} className="glass-panel rounded-[28px] p-5">
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
                className="glass-panel rounded-[30px] p-6 transition-transform duration-200 hover:-translate-y-1"
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
