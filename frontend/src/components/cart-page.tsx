/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth, useCart } from "@/app/providers";
import { formatCurrency } from "@/lib/format";

export function CartPage() {
  const { isAuthenticated } = useAuth();
  const { cart, isLoading, refreshCart, removeItem, updateItem } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!cart && !isLoading) {
      void refreshCart();
    }
  }, [cart, isLoading, refreshCart]);

  async function handleQuantityChange(itemId: string, quantity: number) {
    setFeedback(null);
    setPendingItemId(itemId);
    try {
      await updateItem(itemId, { quantity });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to update quantity.");
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setFeedback(null);
    setPendingItemId(itemId);
    try {
      await removeItem(itemId);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to remove item.");
    } finally {
      setPendingItemId(null);
    }
  }

  if (isLoading && !cart) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading cart
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Resolving the guest or customer cart and checking current stock-aware line totals.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <section className="glass-panel rounded-[40px] p-6 sm:p-8">
            <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
              Stage 3 cart
            </div>
            <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Your cart is ready for the first item.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
              The cart is now persisted server-side for guests and customers. Add something from the catalog to start
              building the checkout path.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
              >
                Browse products
              </Link>
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
                >
                  Sign in and keep this cart
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
                Cart items
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Review the cart before checkout arrives.
              </h1>
            </div>
            <Link href="/products" className="text-sm font-semibold text-[var(--teal)]">
              Continue shopping
            </Link>
          </div>

          {feedback ? (
            <p className="mt-5 rounded-[20px] border border-[rgba(180,83,79,0.2)] bg-[rgba(180,83,79,0.08)] px-4 py-3 text-sm" style={{ color: "var(--rose)" }}>
              {feedback}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4">
            {cart.items.map((item) => (
              <article key={item.id} className="rounded-[28px] border border-[var(--line)] bg-white/70 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                  <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(183,121,31,0.12))]">
                    {item.primary_image_url ? (
                      <img src={item.primary_image_url} alt={item.product_name} className="h-28 w-full object-contain p-5" />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <Link href={`/products/${item.product_slug}`} className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                          {item.product_name}
                        </Link>
                        <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                          {item.variant_name} • SKU {item.sku}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                          {formatCurrency(item.line_total, item.currency)}
                        </p>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                          {formatCurrency(item.unit_price, item.currency)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div className="grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                          Quantity
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => void handleQuantityChange(item.id, Math.max(1, Number(event.target.value) || 1))}
                          disabled={pendingItemId === item.id}
                          className="w-24 rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: item.is_in_stock ? "var(--teal)" : "var(--rose)" }}>
                          {item.is_in_stock
                            ? `${item.available_stock} available`
                            : item.allow_backorder
                              ? "Backorder enabled"
                              : "Out of stock"}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleRemove(item.id)}
                          disabled={pendingItemId === item.id}
                          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="glass-panel h-fit rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--brass-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brass)]">
            Summary
          </div>
          <h2 className="mt-5 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
            Cart totals stay on the server.
          </h2>
          <div className="mt-6 grid gap-4 text-sm">
            <p><strong>Total units:</strong> {cart.item_count}</p>
            <p><strong>Unique lines:</strong> {cart.unique_item_count}</p>
            <p><strong>Subtotal:</strong> {formatCurrency(cart.subtotal, cart.currency)}</p>
          </div>

          <div className="mt-6 rounded-[28px] border border-[var(--line)] bg-white/65 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Next milestone
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Stage 4 will turn this cart into a checkout session and an order with inventory reservation and idempotent
              placement rules.
            </p>
          </div>

          {!isAuthenticated ? (
            <div className="mt-6 rounded-[28px] border border-[var(--line)] bg-white/65 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Guest cart
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Sign in later and the current guest cart will merge into your customer cart automatically.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
