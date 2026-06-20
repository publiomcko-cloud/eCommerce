"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth, useCart } from "@/app/providers";
import { formatCurrency } from "@/lib/format";
import { ProductVisual } from "@/components/product-visual";

function QuantityButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] bg-white text-lg font-semibold transition hover:border-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

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
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-[420px] animate-pulse rounded-lg bg-white" />
          <div className="h-[420px] animate-pulse rounded-lg bg-white" />
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto grid min-h-[60vh] max-w-5xl place-items-center rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow)]">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
              Shopping cart
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Your cart is empty.
            </h1>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Add a product from the catalog to review quantities, totals, and checkout options.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/products"
                className="rounded-full border border-[#111827] bg-[#111827] px-6 py-3 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:border-[#005f55] hover:bg-[#005f55]"
                style={{ color: "#ffffff" }}
              >
                Shop products
              </Link>
              {!isAuthenticated ? (
                <Link href="/login" className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold">
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)] sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
                Shopping cart
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Review your order.
              </h1>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Update quantities, confirm stock, and continue to the secure demo checkout.
              </p>
            </div>
            <Link
              href="/products"
              className="rounded-full border border-[#111827] bg-[#111827] px-5 py-3 text-center text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:border-[#005f55] hover:bg-[#005f55]"
              style={{ color: "#ffffff" }}
            >
              Continue shopping
            </Link>
          </div>

          {feedback ? (
            <p className="mt-5 rounded-lg border border-[rgba(180,35,58,0.18)] bg-[rgba(180,35,58,0.08)] px-4 py-3 text-sm" style={{ color: "var(--rose)" }}>
              {feedback}
            </p>
          ) : null}

          <div className="mt-6 grid gap-4">
            {cart.items.map((item) => (
              <article key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--background)] p-4 sm:p-5">
                <div className="grid gap-5 sm:grid-cols-[132px_1fr]">
                  <Link href={`/products/${item.product_slug}`} className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
                    <ProductVisual
                      name={item.product_name}
                      imageUrl={item.primary_image_url}
                      className="aspect-square w-full"
                      imageClassName="aspect-square w-full object-contain p-5"
                    />
                  </Link>

                  <div className="grid gap-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <Link href={`/products/${item.product_slug}`} className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                          {item.product_name}
                        </Link>
                        <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                          {item.variant_name} / SKU {item.sku}
                        </p>
                        <p className="mt-2 text-xs font-semibold" style={{ color: item.is_in_stock ? "var(--teal)" : "var(--rose)" }}>
                          {item.is_in_stock
                            ? `${item.available_stock} available`
                            : item.allow_backorder
                              ? "Backorder enabled"
                              : "Out of stock"}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                          {formatCurrency(item.line_total, item.currency)}
                        </p>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                          {formatCurrency(item.unit_price, item.currency)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <QuantityButton
                          disabled={pendingItemId === item.id || item.quantity <= 1}
                          onClick={() => void handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          -
                        </QuantityButton>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => void handleQuantityChange(item.id, Math.max(1, Number(event.target.value) || 1))}
                          disabled={pendingItemId === item.id}
                          className="h-10 w-16 rounded-full border border-[var(--line)] bg-white text-center text-sm font-semibold outline-none transition focus:border-[var(--teal)]"
                        />
                        <QuantityButton
                          disabled={pendingItemId === item.id}
                          onClick={() => void handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          +
                        </QuantityButton>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleRemove(item.id)}
                        disabled={pendingItemId === item.id}
                        className="w-fit rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] lg:sticky lg:top-32">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
            Order summary
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
            {formatCurrency(cart.subtotal, cart.currency)}
          </h2>

          <div className="mt-6 grid gap-3 border-y border-[var(--line)] py-5 text-sm">
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>Items</span>
              <strong>{cart.item_count}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>Product lines</span>
              <strong>{cart.unique_item_count}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>Subtotal</span>
              <strong>{formatCurrency(cart.subtotal, cart.currency)}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>Shipping</span>
              <strong>Calculated in demo checkout</strong>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-[var(--teal-soft)] p-4">
            <p className="font-semibold text-[var(--teal)]">Safe demo checkout</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              No real payment data is collected. Orders use the mock payment provider.
            </p>
          </div>

          {isAuthenticated ? (
            <Link
              href="/checkout"
              className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--teal)]"
            >
              Checkout
            </Link>
          ) : (
            <div className="mt-6 grid gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--teal)]"
              >
                Sign in to checkout
              </Link>
              <Link href="/register" className="text-center text-sm font-semibold text-[var(--teal)]">
                Create an account
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
