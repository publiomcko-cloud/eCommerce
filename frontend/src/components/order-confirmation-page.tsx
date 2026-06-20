"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import {
  createOrderPayment,
  fetchCheckoutOrder,
  simulateOrderPaymentFailure,
  simulateOrderPaymentSuccess,
} from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

type OrderConfirmationPageProps = {
  orderId: string;
};

function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const styles = {
    neutral: { backgroundColor: "var(--background)", color: "var(--foreground)" },
    success: { backgroundColor: "var(--teal-soft)", color: "var(--teal)" },
    warning: { backgroundColor: "var(--brass-soft)", color: "var(--brass)" },
    danger: { backgroundColor: "rgba(180,35,58,0.1)", color: "var(--rose)" },
  };

  return (
    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={styles[tone]}>
      {label}
    </span>
  );
}

export function OrderConfirmationPage({ orderId }: OrderConfirmationPageProps) {
  const { token, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const orderQuery = useQuery({
    queryKey: ["checkout-order", orderId, token],
    queryFn: () => fetchCheckoutOrder(token ?? "", orderId),
    enabled: Boolean(token),
  });
  const createPaymentMutation = useMutation({
    mutationFn: async () => createOrderPayment(token ?? "", orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["checkout-order", orderId] });
    },
  });
  const simulateSuccessMutation = useMutation({
    mutationFn: async (paymentId: string) => simulateOrderPaymentSuccess(token ?? "", paymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["checkout-order", orderId] });
    },
  });
  const simulateFailureMutation = useMutation({
    mutationFn: async (paymentId: string) => simulateOrderPaymentFailure(token ?? "", paymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["checkout-order", orderId] });
    },
  });

  if (isLoading || orderQuery.isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
          <div className="h-[480px] animate-pulse rounded-lg bg-white" />
          <div className="h-[480px] animate-pulse rounded-lg bg-white" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto grid min-h-[60vh] max-w-5xl place-items-center rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow)]">
          <div className="max-w-xl">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
              Sign in to view this order.
            </h1>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Order receipts are available to the customer account that placed them.
            </p>
            <Link href="/login" className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white">
              Login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto grid min-h-[60vh] max-w-5xl place-items-center rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow)]">
          <div className="max-w-xl">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
              Order not available.
            </h1>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              This order could not be loaded for the current account.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full border border-[#111827] bg-[#111827] px-6 py-3 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:border-[#005f55] hover:bg-[#005f55]"
              style={{ color: "#ffffff" }}
            >
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const order = orderQuery.data;
  const payment = order.payment;
  const paymentFeedback =
    (createPaymentMutation.error instanceof Error && createPaymentMutation.error.message) ||
    (simulateSuccessMutation.error instanceof Error && simulateSuccessMutation.error.message) ||
    (simulateFailureMutation.error instanceof Error && simulateFailureMutation.error.message) ||
    null;
  const isMutatingPayment =
    createPaymentMutation.isPending || simulateSuccessMutation.isPending || simulateFailureMutation.isPending;
  const paymentTone =
    payment?.status === "succeeded" ? "success" : payment?.status === "failed" ? "danger" : payment ? "warning" : "neutral";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-8 lg:p-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
                Order confirmation
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Thanks, your order was created.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: "var(--muted)" }}>
                Order {order.order_number} is saved with reserved inventory and a locked checkout snapshot.
              </p>
            </div>
            <div className="grid gap-2 rounded-lg bg-[var(--background)] p-5 lg:min-w-[280px]">
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "var(--muted)" }}>Order</span>
                <strong>{order.order_number}</strong>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "var(--muted)" }}>Created</span>
                <strong>{formatDateTime(order.created_at)}</strong>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span style={{ color: "var(--muted)" }}>Status</span>
                <StatusBadge label={order.status} tone={order.status === "paid" ? "success" : order.status === "cancelled" ? "danger" : "warning"} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-full border border-[#111827] bg-[#111827] px-6 py-3 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:border-[#005f55] hover:bg-[#005f55]"
              style={{ color: "#ffffff" }}
            >
              Continue shopping
            </Link>
            <Link href="/account" className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold">
              View account orders
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_390px] lg:items-start">
          <div className="grid gap-6">
            <article className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-8">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Items
              </h2>
              <div className="mt-5 grid gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--background)] p-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <Link href={`/products/${item.product_slug}`} className="font-semibold">
                          {item.product_name}
                        </Link>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                          {item.variant_name} / SKU {item.sku} / qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.line_total, order.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-8 md:grid-cols-2">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  Shipping
                </h2>
                <div className="mt-4 grid gap-2 text-sm" style={{ color: "var(--muted)" }}>
                  <p className="font-semibold text-[var(--foreground)]">{order.shipping_address.recipient_name}</p>
                  <p>{order.shipping_address.line1}</p>
                  {order.shipping_address.line2 ? <p>{order.shipping_address.line2}</p> : null}
                  <p>{order.shipping_address.city}, {order.shipping_address.region}</p>
                  <p>{order.shipping_address.postal_code}</p>
                  <p>{order.shipping_address.country}</p>
                </div>
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  Billing
                </h2>
                <div className="mt-4 grid gap-2 text-sm" style={{ color: "var(--muted)" }}>
                  <p className="font-semibold text-[var(--foreground)]">{order.billing_address.recipient_name}</p>
                  <p>{order.billing_address.line1}</p>
                  {order.billing_address.line2 ? <p>{order.billing_address.line2}</p> : null}
                  <p>{order.billing_address.city}, {order.billing_address.region}</p>
                  <p>{order.billing_address.postal_code}</p>
                  <p>{order.billing_address.country}</p>
                </div>
              </div>
            </article>
          </div>

          <aside className="grid gap-6 lg:sticky lg:top-32">
            <article className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
                    Payment
                  </p>
                  <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
                    Mock payment
                  </h2>
                </div>
                <StatusBadge label={payment?.status ?? "not created"} tone={paymentTone} />
              </div>

              <div className="mt-6 grid gap-3 border-y border-[var(--line)] py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--muted)" }}>Subtotal</span>
                  <strong>{formatCurrency(order.subtotal_amount, order.currency)}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: "var(--muted)" }}>Total</span>
                  <strong>{formatCurrency(order.total_amount, order.currency)}</strong>
                </div>
                {payment ? (
                  <div className="flex justify-between gap-4">
                    <span style={{ color: "var(--muted)" }}>Provider</span>
                    <strong>{payment.provider_name}</strong>
                  </div>
                ) : null}
              </div>

              {paymentFeedback ? (
                <p className="mt-5 rounded-lg bg-[rgba(180,35,58,0.08)] px-4 py-3 text-sm" style={{ color: "var(--rose)" }}>
                  {paymentFeedback}
                </p>
              ) : null}

              {!payment && order.status === "pending_payment" ? (
                <button
                  type="button"
                  onClick={() => createPaymentMutation.mutate()}
                  disabled={isMutatingPayment}
                  className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createPaymentMutation.isPending ? "Creating payment..." : "Create mock payment"}
                </button>
              ) : null}

              {payment?.status === "pending" ? (
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={() => simulateSuccessMutation.mutate(payment.id)}
                    disabled={isMutatingPayment}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {simulateSuccessMutation.isPending ? "Processing..." : "Simulate payment success"}
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateFailureMutation.mutate(payment.id)}
                    disabled={isMutatingPayment}
                    className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {simulateFailureMutation.isPending ? "Processing..." : "Simulate payment failure"}
                  </button>
                </div>
              ) : null}

              {payment?.status === "succeeded" ? (
                <p className="mt-5 rounded-lg bg-[var(--teal-soft)] px-4 py-3 text-sm font-semibold text-[var(--teal)]">
                  Payment captured. The order is paid.
                </p>
              ) : null}

              {payment?.status === "failed" ? (
                <p className="mt-5 rounded-lg bg-[rgba(180,35,58,0.08)] px-4 py-3 text-sm font-semibold" style={{ color: "var(--rose)" }}>
                  Payment failed and the order was cancelled.
                </p>
              ) : null}
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
