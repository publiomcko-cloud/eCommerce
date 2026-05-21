"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import { fetchAdminOrders } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

export function AdminOrdersPage() {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [shipmentFilter, setShipmentFilter] = useState("all");

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", token, statusFilter, paymentFilter, shipmentFilter],
    queryFn: () =>
      fetchAdminOrders(token ?? "", {
        status: statusFilter === "all" ? undefined : statusFilter,
        payment_status: paymentFilter === "all" ? undefined : paymentFilter,
        shipment_status: shipmentFilter === "all" ? undefined : shipmentFilter,
        limit: 50,
      }),
    enabled: Boolean(token && user?.role === "admin"),
  });

  if (isLoading) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading admin orders
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Pulling protected order operations data from the commerce back office.
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
              The order operations panel is reserved for admin users.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
                Order management
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Review every order lifecycle from payment state to shipment state.
              </h1>
              <p className="mt-4 text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                Filter the back office queue, then open any order for status transitions and shipment updates.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
            >
              Back to overview
            </Link>
          </div>
        </section>

        <section className="glass-panel rounded-[32px] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                label: "Order status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: ["all", "pending_payment", "paid", "fulfilled", "cancelled"],
              },
              {
                label: "Payment status",
                value: paymentFilter,
                onChange: setPaymentFilter,
                options: ["all", "pending", "succeeded", "failed"],
              },
              {
                label: "Shipment status",
                value: shipmentFilter,
                onChange: setShipmentFilter,
                options: ["all", "pending", "packed", "shipped", "delivered"],
              },
            ].map((filter) => (
              <label key={filter.label} className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                  {filter.label}
                </span>
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className="rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                >
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All" : option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        {ordersQuery.isError ? (
          <section className="glass-panel rounded-[32px] p-8 text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Admin orders could not be loaded
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Confirm the backend is running and that your admin session is still valid.
            </p>
          </section>
        ) : null}

        {!ordersQuery.isError && (ordersQuery.data?.items.length ?? 0) === 0 ? (
          <section className="glass-panel rounded-[32px] p-8 text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              No orders match these filters
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Broaden the current filters or place a new checkout order to populate the queue.
            </p>
          </section>
        ) : null}

        {!ordersQuery.isError && (ordersQuery.data?.items.length ?? 0) > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ordersQuery.data?.items.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="glass-panel rounded-[30px] p-5 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      {order.customer_email}
                    </p>
                    <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                      {order.order_number}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    {order.status}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <p><strong>Payment:</strong> {order.payment_status ?? "not created"}</p>
                  <p><strong>Shipment:</strong> {order.shipment_status ?? "not created"}</p>
                  <p><strong>Items:</strong> {order.item_count}</p>
                  <p><strong>Total:</strong> {formatCurrency(order.total_amount, order.currency)}</p>
                  <p><strong>Created:</strong> {formatDateTime(order.created_at)}</p>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
