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
  const payment = order.payment;
  const paymentFeedback =
    (createPaymentMutation.error instanceof Error && createPaymentMutation.error.message) ||
    (simulateSuccessMutation.error instanceof Error && simulateSuccessMutation.error.message) ||
    (simulateFailureMutation.error instanceof Error && simulateFailureMutation.error.message) ||
    null;
  const isMutatingPayment =
    createPaymentMutation.isPending || simulateSuccessMutation.isPending || simulateFailureMutation.isPending;

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
            Stage 5 payment flow
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Order {order.order_number} is ready for payment.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
            The order snapshot is locked, inventory is reserved, and the mock provider can now drive success or
            failure without introducing real payment credentials.
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
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                    Payment state
                  </h2>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                    Mock payments update the order lifecycle and inventory reservation in real time.
                  </p>
                </div>
                <div className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  {payment?.status ?? "not created"}
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <p><strong>Order status:</strong> {order.status}</p>
                {payment ? (
                  <>
                    <p><strong>Provider:</strong> {payment.provider_name}</p>
                    <p><strong>Provider payment ID:</strong> {payment.provider_payment_id}</p>
                    <p><strong>Session token:</strong> {payment.provider_session_token}</p>
                    <p><strong>Amount:</strong> {formatCurrency(payment.amount, payment.currency)}</p>
                    <p><strong>Completed:</strong> {formatDateTime(payment.completed_at)}</p>
                    {payment.failure_reason ? <p><strong>Failure reason:</strong> {payment.failure_reason}</p> : null}
                  </>
                ) : (
                  <p style={{ color: "var(--muted)" }}>
                    No payment intent exists yet for this order.
                  </p>
                )}
              </div>

              {paymentFeedback ? (
                <p className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {paymentFeedback}
                </p>
              ) : null}

              {!payment && order.status === "pending_payment" ? (
                <button
                  type="button"
                  onClick={() => createPaymentMutation.mutate()}
                  disabled={isMutatingPayment}
                  className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createPaymentMutation.isPending ? "Creating mock payment..." : "Create mock payment"}
                </button>
              ) : null}

              {payment?.status === "pending" ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => simulateSuccessMutation.mutate(payment.id)}
                    disabled={isMutatingPayment}
                    className="inline-flex rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {simulateSuccessMutation.isPending ? "Processing success..." : "Simulate success"}
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateFailureMutation.mutate(payment.id)}
                    disabled={isMutatingPayment}
                    className="inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {simulateFailureMutation.isPending ? "Processing failure..." : "Simulate failure"}
                  </button>
                </div>
              ) : null}

              {payment?.status === "succeeded" ? (
                <p className="mt-6 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Payment is captured and the order is marked as paid.
                </p>
              ) : null}

              {payment?.status === "failed" ? (
                <p className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  Payment failed, the order is cancelled, and the reservation was released back to inventory.
                </p>
              ) : null}
            </article>

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
