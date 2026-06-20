"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import {
  createAdminRefund,
  AdminShipmentUpsertInput,
  fetchAdminOrderDetail,
  upsertAdminShipment,
  updateAdminOrderStatus,
} from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

type AdminOrderDetailPageProps = {
  orderId: string;
};

type ShipmentFormState = {
  carrier: string;
  service_level: string;
  tracking_number: string;
  status: "pending" | "packed" | "shipped" | "delivered";
  notes: string;
};

const EMPTY_SHIPMENT_FORM: ShipmentFormState = {
  carrier: "",
  service_level: "",
  tracking_number: "",
  status: "pending",
  notes: "",
};

function toShipmentPayload(form: ShipmentFormState): AdminShipmentUpsertInput {
  return {
    carrier: form.carrier || undefined,
    service_level: form.service_level || undefined,
    tracking_number: form.tracking_number || undefined,
    status: form.status,
    notes: form.notes || undefined,
  };
}

export function AdminOrderDetailPage({ orderId }: AdminOrderDetailPageProps) {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const queryClient = useQueryClient();
  const [statusReason, setStatusReason] = useState("");
  const [shipmentForm, setShipmentForm] = useState<ShipmentFormState>(EMPTY_SHIPMENT_FORM);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const orderQuery = useQuery({
    queryKey: ["admin-order-detail", orderId, token],
    queryFn: () => fetchAdminOrderDetail(token ?? "", orderId),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const order = orderQuery.data;
  const allowedNextStatuses = useMemo(() => {
    if (!order) {
      return [];
    }
    if (order.status === "pending_payment") {
      return ["cancelled"] as const;
    }
    if (order.status === "paid") {
      return ["fulfilled"] as const;
    }
    return [] as const;
  }, [order]);

  const statusMutation = useMutation({
    mutationFn: async (status: "cancelled" | "fulfilled") =>
      updateAdminOrderStatus(token ?? "", orderId, { status, reason: statusReason || undefined }),
    onSuccess: async (updatedOrder) => {
      setStatusReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.setQueryData(["admin-order-detail", orderId, token], updatedOrder);
    },
  });

  const shipmentMutation = useMutation({
    mutationFn: async (payload: AdminShipmentUpsertInput) => upsertAdminShipment(token ?? "", orderId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId, token] }),
      ]);
    },
  });

  const refundMutation = useMutation({
    mutationFn: async () =>
      createAdminRefund(token ?? "", orderId, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason || undefined,
      }),
    onSuccess: async () => {
      setRefundAmount("");
      setRefundReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-order-detail", orderId, token] }),
      ]);
    },
  });

  if (isLoading || orderQuery.isLoading) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading admin order detail
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Pulling the full order, payment, and shipment snapshot from the back office API.
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
              Order operations are protected by the admin role check.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Order could not be loaded
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              The selected order was not found or the admin session is no longer valid.
            </p>
            <Link
              href="/admin/orders"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  async function handleShipmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await shipmentMutation.mutateAsync(toShipmentPayload(shipmentForm));
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
                Admin order detail
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                {order.order_number}
              </h1>
              <p className="mt-4 text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                Review payment state, update allowed status transitions, and represent shipment progress for this order.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
            >
              Back to orders
            </Link>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-6">
            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Order summary
              </h2>
              <div className="mt-5 grid gap-3 text-sm">
                <p><strong>Status:</strong> {order.status}</p>
                <p><strong>Payment:</strong> {order.payment?.status ?? "not created"}</p>
                <p><strong>Shipment:</strong> {order.shipment?.status ?? "not created"}</p>
                <p><strong>Refunds:</strong> {order.refunds.length}</p>
                <p><strong>Customer:</strong> {order.email}</p>
                <p><strong>Created:</strong> {formatDateTime(order.created_at)}</p>
                <p><strong>Total:</strong> {formatCurrency(order.total_amount, order.currency)}</p>
              </div>
            </article>

            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Refunds
              </h2>
              <div className="mt-5 grid gap-3">
                {order.refunds.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-4 text-sm" style={{ color: "var(--muted)" }}>
                    No refunds have been recorded for this order.
                  </div>
                ) : (
                  order.refunds.map((refund) => (
                    <div key={refund.id} className="rounded-[22px] border border-[var(--line)] bg-white/70 p-4 text-sm">
                      <p><strong>{formatCurrency(refund.amount, refund.currency)}</strong> • {refund.status}</p>
                      <p className="mt-1" style={{ color: "var(--muted)" }}>{refund.reason ?? "No reason provided"}</p>
                      <p className="mt-2" style={{ color: "var(--muted)" }}>{formatDateTime(refund.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Line items
              </h2>
              <div className="mt-5 grid gap-4">
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
            </article>

            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Refund action
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Mock refunds are recorded for paid orders and included in payment health metrics.
              </p>
              {refundMutation.error instanceof Error ? (
                <p className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {refundMutation.error.message}
                </p>
              ) : null}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  refundMutation.mutate();
                }}
                className="mt-5 grid gap-4"
              >
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    placeholder="Full remaining amount"
                    className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Reason</span>
                  <textarea
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                    className="min-h-24 rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={refundMutation.isPending || order.payment?.status !== "succeeded"}
                  className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refundMutation.isPending ? "Creating refund..." : "Create refund"}
                </button>
              </form>
            </article>

            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Status history
              </h2>
              <div className="mt-5 grid gap-3">
                {order.status_history.map((entry) => (
                  <div key={entry.id} className="rounded-[22px] border border-[var(--line)] bg-white/70 p-4 text-sm">
                    <p><strong>{entry.from_status ?? "none"} → {entry.to_status}</strong></p>
                    <p className="mt-1" style={{ color: "var(--muted)" }}>{entry.reason ?? "No reason provided"}</p>
                    <p className="mt-2" style={{ color: "var(--muted)" }}>{formatDateTime(entry.created_at)}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="grid gap-6">
            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Status actions
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Admin status transitions are intentionally narrow to keep the order lifecycle auditable.
              </p>
              {statusMutation.error instanceof Error ? (
                <p className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {statusMutation.error.message}
                </p>
              ) : null}
              {allowedNextStatuses.length === 0 ? (
                <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line)] bg-white/60 p-4 text-sm" style={{ color: "var(--muted)" }}>
                  No further admin status transition is available for this order.
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Reason</span>
                    <textarea
                      value={statusReason}
                      onChange={(event) => setStatusReason(event.target.value)}
                      className="min-h-24 rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                    />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {allowedNextStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => statusMutation.mutate(status)}
                        disabled={statusMutation.isPending}
                        className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusMutation.isPending ? "Saving..." : `Mark ${status}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article className="glass-panel rounded-[32px] p-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Shipment representation
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Add or update a shipment record once payment is successful.
              </p>
              {shipmentMutation.error instanceof Error ? (
                <p className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {shipmentMutation.error.message}
                </p>
              ) : null}
              <form onSubmit={(event) => void handleShipmentSubmit(event)} className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Carrier</span>
                  <input value={shipmentForm.carrier} onChange={(event) => setShipmentForm((current) => ({ ...current, carrier: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Service level</span>
                  <input value={shipmentForm.service_level} onChange={(event) => setShipmentForm((current) => ({ ...current, service_level: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Tracking number</span>
                  <input value={shipmentForm.tracking_number} onChange={(event) => setShipmentForm((current) => ({ ...current, tracking_number: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Shipment status</span>
                  <select
                    value={shipmentForm.status}
                    onChange={(event) => setShipmentForm((current) => ({ ...current, status: event.target.value as ShipmentFormState["status"] }))}
                    className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                  >
                    <option value="pending">pending</option>
                    <option value="packed">packed</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Notes</span>
                  <textarea
                    value={shipmentForm.notes}
                    onChange={(event) => setShipmentForm((current) => ({ ...current, notes: event.target.value }))}
                    className="min-h-24 rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={shipmentMutation.isPending}
                  className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {shipmentMutation.isPending ? "Saving shipment..." : "Save shipment"}
                </button>
              </form>

              {order.shipment ? (
                <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-white/70 p-4 text-sm">
                  <p><strong>Current shipment:</strong> {order.shipment.status}</p>
                  <p><strong>Carrier:</strong> {order.shipment.carrier ?? "Not set"}</p>
                  <p><strong>Tracking:</strong> {order.shipment.tracking_number ?? "Not set"}</p>
                </div>
              ) : null}
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
