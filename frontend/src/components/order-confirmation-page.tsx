"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import { fetchCheckoutOrder } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

type OrderConfirmationPageProps = {
  orderId: string;
};

export function OrderConfirmationPage({ orderId }: OrderConfirmationPageProps) {
  const { token, isAuthenticated, isLoading } = useAuth();
  const orderQuery = useQuery({
    queryKey: ["checkout-order", orderId, token],
    queryFn: () => fetchCheckoutOrder(token ?? "", orderId),
    enabled: Boolean(token),
  });

  if (isLoading || orderQuery.isLoading) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading confirmation
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Pulling the placed order snapshot from the checkout API.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Sign in to view the order
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Order confirmation is currently available to the authenticated customer who placed it.
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

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Order not available
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              The order could not be loaded for this account.
            </p>
            <Link
              href="/cart"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
            >
              Back to cart
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const order = orderQuery.data;

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
            Order placed
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Order {order.order_number} is created.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
            This Stage 4 confirmation proves the order snapshot, idempotency flow, and inventory reservation are all
            wired end to end.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Order details
            </h2>
            <div className="mt-5 grid gap-3 text-sm">
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Email:</strong> {order.email}</p>
              <p><strong>Created:</strong> {formatDateTime(order.created_at)}</p>
              <p><strong>Subtotal:</strong> {formatCurrency(order.subtotal_amount, order.currency)}</p>
              <p><strong>Total:</strong> {formatCurrency(order.total_amount, order.currency)}</p>
            </div>

            <div className="mt-6 grid gap-4">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/products/${item.product_slug}`} className="font-semibold">
                        {item.product_name}
                      </Link>
                      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                        {item.variant_name} • SKU {item.sku} • qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.line_total, order.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Shipping snapshot
              </h2>
              <div className="mt-5 grid gap-3 text-sm">
                <p><strong>Recipient:</strong> {order.shipping_address.recipient_name}</p>
                <p><strong>Phone:</strong> {order.shipping_address.phone ?? "Not provided"}</p>
                <p><strong>Address:</strong> {order.shipping_address.line1}</p>
                {order.shipping_address.line2 ? <p><strong>Complement:</strong> {order.shipping_address.line2}</p> : null}
                <p><strong>City:</strong> {order.shipping_address.city}</p>
                <p><strong>Region:</strong> {order.shipping_address.region}</p>
                <p><strong>Postal code:</strong> {order.shipping_address.postal_code}</p>
                <p><strong>Country:</strong> {order.shipping_address.country}</p>
              </div>
            </article>

            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Billing snapshot
              </h2>
              <div className="mt-5 grid gap-3 text-sm">
                <p><strong>Recipient:</strong> {order.billing_address.recipient_name}</p>
                <p><strong>Phone:</strong> {order.billing_address.phone ?? "Not provided"}</p>
                <p><strong>Address:</strong> {order.billing_address.line1}</p>
                {order.billing_address.line2 ? <p><strong>Complement:</strong> {order.billing_address.line2}</p> : null}
                <p><strong>City:</strong> {order.billing_address.city}</p>
                <p><strong>Region:</strong> {order.billing_address.region}</p>
                <p><strong>Postal code:</strong> {order.billing_address.postal_code}</p>
                <p><strong>Country:</strong> {order.billing_address.country}</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
