"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import { adjustAdminInventory, fetchAdminInventory } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

type AdjustmentDraftState = Record<string, { quantity_delta: string; reason: string }>;

export function AdminInventoryPage() {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [drafts, setDrafts] = useState<AdjustmentDraftState>({});

  const inventoryQuery = useQuery({
    queryKey: ["admin-inventory", token, search, lowStockOnly],
    queryFn: () => fetchAdminInventory(token ?? "", { q: search || undefined, low_stock_only: lowStockOnly, limit: 100 }),
    enabled: Boolean(token && user?.role === "admin"),
  });

  const adjustmentMutation = useMutation({
    mutationFn: async ({ variantId, quantityDelta, reason }: { variantId: string; quantityDelta: number; reason?: string }) =>
      adjustAdminInventory(token ?? "", { variant_id: variantId, quantity_delta: quantityDelta, reason }),
    onSuccess: async (_, variables) => {
      setDrafts((current) => ({
        ...current,
        [variables.variantId]: { quantity_delta: "", reason: "" },
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
      ]);
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-lg border border-[var(--line)] bg-white px-6 py-20 text-center shadow-[var(--shadow)]">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading inventory workspace
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Pulling variant stock, reservations, and adjustment controls from the admin API.
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
              Inventory adjustments are protected because they change sellable stock.
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

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                Inventory management
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Watch availability, reservations, and low-stock pressure variant by variant.
              </h1>
            </div>
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
            >
              Back to overview
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                Search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product, variant, or SKU"
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
              />
            </label>
            <label className="flex items-end gap-3 rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm">
              <input type="checkbox" checked={lowStockOnly} onChange={(event) => setLowStockOnly(event.target.checked)} />
              Low stock only
            </label>
          </div>
        </section>

        {inventoryQuery.isError ? (
          <section className="rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Inventory data could not be loaded
            </h2>
          </section>
        ) : null}

        {!inventoryQuery.isError && (
          <section className="grid gap-5">
            {(inventoryQuery.data?.items ?? []).map((item) => {
              const draft = drafts[item.variant_id] ?? { quantity_delta: "", reason: "" };
              return (
                <article key={item.variant_id} className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        {item.category_name}
                      </p>
                      <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                        {item.product_name}
                      </h2>
                      <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                        {item.variant_name} • SKU {item.sku} • {item.variant_status}
                      </p>
                      <div className="mt-4 grid gap-2 text-sm">
                        <p><strong>Price:</strong> {formatCurrency(item.price, "BRL")}</p>
                        <p><strong>On hand:</strong> {item.stock_on_hand}</p>
                        <p><strong>Reserved:</strong> {item.stock_reserved}</p>
                        <p><strong>Available:</strong> {item.available_stock}</p>
                        <p><strong>Low stock threshold:</strong> {item.low_stock_threshold}</p>
                      </div>
                    </div>
                    <div className="w-full max-w-xl rounded-lg border border-[var(--line)] bg-[var(--background)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Quick adjustment
                      </p>
                      <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_auto]">
                        <input
                          value={draft.quantity_delta}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [item.variant_id]: {
                                ...draft,
                                quantity_delta: event.target.value,
                              },
                            }))
                          }
                          placeholder="+10 or -2"
                          className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                        />
                        <input
                          value={draft.reason}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [item.variant_id]: {
                                ...draft,
                                reason: event.target.value,
                              },
                            }))
                          }
                          placeholder="Reason for the adjustment"
                          className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                        />
                        <button
                          type="button"
                          disabled={adjustmentMutation.isPending || !draft.quantity_delta}
                          onClick={() =>
                            adjustmentMutation.mutate({
                              variantId: item.variant_id,
                              quantityDelta: Number(draft.quantity_delta),
                              reason: draft.reason || undefined,
                            })
                          }
                          className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Adjust
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
