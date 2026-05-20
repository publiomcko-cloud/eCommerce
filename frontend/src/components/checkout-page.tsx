"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { useAuth, useCart } from "@/app/providers";
import { createCheckoutSession, placeCheckoutOrder } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

type CheckoutFormState = {
  email: string;
  shippingRecipientName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
  billingSameAsShipping: boolean;
  billingRecipientName: string;
  billingPhone: string;
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingRegion: string;
  billingPostalCode: string;
  billingCountry: string;
};

function createInitialFormState(
  email: string,
  firstName: string,
  lastName: string,
  phone: string,
): CheckoutFormState {
  const recipientName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    email,
    shippingRecipientName: recipientName,
    shippingPhone: phone,
    shippingLine1: "",
    shippingLine2: "",
    shippingCity: "",
    shippingRegion: "",
    shippingPostalCode: "",
    shippingCountry: "BR",
    billingSameAsShipping: true,
    billingRecipientName: recipientName,
    billingPhone: phone,
    billingLine1: "",
    billingLine2: "",
    billingCity: "",
    billingRegion: "",
    billingPostalCode: "",
    billingCountry: "BR",
  };
}

export function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, token, user } = useAuth();
  const { cart, cartToken, isLoading: isCartLoading, refreshCart } = useCart();
  const [form, setForm] = useState(() =>
    createInitialFormState(
      user?.email ?? "",
      user?.customer?.first_name ?? "",
      user?.customer?.last_name ?? "",
      user?.customer?.phone ?? "",
    ),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderSummary = useMemo(() => {
    if (!cart) {
      return null;
    }
    return {
      itemCount: cart.item_count,
      uniqueItemCount: cart.unique_item_count,
      subtotal: cart.subtotal,
      currency: cart.currency,
    };
  }, [cart]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);
    try {
      const shippingAddress = {
        recipient_name: form.shippingRecipientName,
        phone: form.shippingPhone || undefined,
        line1: form.shippingLine1,
        line2: form.shippingLine2 || undefined,
        city: form.shippingCity,
        region: form.shippingRegion,
        postal_code: form.shippingPostalCode,
        country: form.shippingCountry,
      };

      const billingAddress = form.billingSameAsShipping
        ? shippingAddress
        : {
            recipient_name: form.billingRecipientName,
            phone: form.billingPhone || undefined,
            line1: form.billingLine1,
            line2: form.billingLine2 || undefined,
            city: form.billingCity,
            region: form.billingRegion,
            postal_code: form.billingPostalCode,
            country: form.billingCountry,
          };

      const checkoutSession = await createCheckoutSession(
        token,
        {
          email: form.email,
          shipping_address: shippingAddress,
          billing_address: billingAddress,
        },
        cartToken,
      );

      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `checkout-${Date.now()}`;
      const order = await placeCheckoutOrder(token, {
        checkout_session_id: checkoutSession.id,
        idempotency_key: idempotencyKey,
      });
      await refreshCart();
      router.push(`/checkout/confirmation/${order.id}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to place the order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading || isCartLoading) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Preparing checkout
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Validating the authenticated customer cart and loading the current totals.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !token || !user) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Sign in to place the order
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Stage 4 currently converts authenticated customer carts into orders. Your guest cart will merge after you
              sign in.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0 || !orderSummary) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              The cart is empty
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Add products to the cart before opening the checkout flow.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
            >
              Browse products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={(event) => void handleSubmit(event)} className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--brass-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brass)]">
            Stage 4 checkout
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Confirm addresses and place the order.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
            This first checkout slice snapshots addresses and totals, creates an idempotent order, and reserves
            inventory on the backend.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                required
              />
            </label>
          </div>

          <section className="mt-8">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Shipping address
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Recipient</span>
                <input value={form.shippingRecipientName} onChange={(event) => setForm((current) => ({ ...current, shippingRecipientName: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Phone</span>
                <input value={form.shippingPhone} onChange={(event) => setForm((current) => ({ ...current, shippingPhone: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Address line 1</span>
                <input value={form.shippingLine1} onChange={(event) => setForm((current) => ({ ...current, shippingLine1: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Address line 2</span>
                <input value={form.shippingLine2} onChange={(event) => setForm((current) => ({ ...current, shippingLine2: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>City</span>
                <input value={form.shippingCity} onChange={(event) => setForm((current) => ({ ...current, shippingCity: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Region</span>
                <input value={form.shippingRegion} onChange={(event) => setForm((current) => ({ ...current, shippingRegion: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Postal code</span>
                <input value={form.shippingPostalCode} onChange={(event) => setForm((current) => ({ ...current, shippingPostalCode: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Country</span>
                <input value={form.shippingCountry} onChange={(event) => setForm((current) => ({ ...current, shippingCountry: event.target.value.toUpperCase() }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm uppercase outline-none transition focus:border-[var(--teal)]" required />
              </label>
            </div>
          </section>

          <section className="mt-8">
            <label className="flex items-center gap-3 rounded-[20px] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.billingSameAsShipping}
                onChange={(event) => setForm((current) => ({ ...current, billingSameAsShipping: event.target.checked }))}
              />
              Billing address is the same as shipping
            </label>

            {!form.billingSameAsShipping ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Recipient</span>
                  <input value={form.billingRecipientName} onChange={(event) => setForm((current) => ({ ...current, billingRecipientName: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Phone</span>
                  <input value={form.billingPhone} onChange={(event) => setForm((current) => ({ ...current, billingPhone: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Address line 1</span>
                  <input value={form.billingLine1} onChange={(event) => setForm((current) => ({ ...current, billingLine1: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Address line 2</span>
                  <input value={form.billingLine2} onChange={(event) => setForm((current) => ({ ...current, billingLine2: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>City</span>
                  <input value={form.billingCity} onChange={(event) => setForm((current) => ({ ...current, billingCity: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Region</span>
                  <input value={form.billingRegion} onChange={(event) => setForm((current) => ({ ...current, billingRegion: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Postal code</span>
                  <input value={form.billingPostalCode} onChange={(event) => setForm((current) => ({ ...current, billingPostalCode: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Country</span>
                  <input value={form.billingCountry} onChange={(event) => setForm((current) => ({ ...current, billingCountry: event.target.value.toUpperCase() }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm uppercase outline-none transition focus:border-[var(--teal)]" required />
                </label>
              </div>
            ) : null}
          </section>

          {feedback ? (
            <p className="mt-6 rounded-[20px] border border-[rgba(180,83,79,0.2)] bg-[rgba(180,83,79,0.08)] px-4 py-3 text-sm" style={{ color: "var(--rose)" }}>
              {feedback}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Placing order..." : "Place order"}
            </button>
            <Link href="/cart" className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold">
              Back to cart
            </Link>
          </div>
        </form>

        <aside className="glass-panel h-fit rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
            Order summary
          </div>
          <h2 className="mt-5 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
            Snapshot before order creation.
          </h2>
          <div className="mt-6 grid gap-4 text-sm">
            <p><strong>Total units:</strong> {orderSummary.itemCount}</p>
            <p><strong>Unique lines:</strong> {orderSummary.uniqueItemCount}</p>
            <p><strong>Subtotal:</strong> {formatCurrency(orderSummary.subtotal, orderSummary.currency)}</p>
          </div>

          <div className="mt-6 grid gap-3">
            {cart.items.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {item.variant_name} • qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.line_total, item.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
