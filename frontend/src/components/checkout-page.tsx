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

type FieldProps = {
  label: string;
  value: string;
  required?: boolean;
  type?: string;
  className?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
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

function Field({
  label,
  value,
  required,
  type = "text",
  className = "",
  autoComplete,
  onChange,
}: FieldProps) {
  return (
    <label className={`grid gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
      />
    </label>
  );
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
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
          <div className="h-[560px] animate-pulse rounded-lg bg-white" />
          <div className="h-[560px] animate-pulse rounded-lg bg-white" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !token || !user) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto grid min-h-[60vh] max-w-5xl place-items-center rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow)]">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
              Checkout
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
              Sign in to checkout.
            </h1>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Create or access a customer account to place a demo order. Your cart will stay available after sign-in.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login" className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white">
                Login
              </Link>
              <Link href="/register" className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold">
                Register
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!cart || cart.items.length === 0 || !orderSummary) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <section className="mx-auto grid min-h-[60vh] max-w-5xl place-items-center rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow)]">
          <div className="max-w-xl">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
              Your cart is empty.
            </h1>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Add products to the cart before opening checkout.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full border border-[#111827] bg-[#111827] px-6 py-3 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:border-[#005f55] hover:bg-[#005f55]"
              style={{ color: "#ffffff" }}
            >
              Shop products
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_390px] lg:items-start">
        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-5">
          <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
              Checkout
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Complete your demo order.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--muted)" }}>
              Confirm contact and delivery details. Payment is simulated safely by the mock provider.
            </p>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--foreground)] text-sm font-semibold text-white">1</span>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Contact
              </h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field
                label="Email"
                type="email"
                value={form.email}
                required
                autoComplete="email"
                className="md:col-span-2"
                onChange={(email) => setForm((current) => ({ ...current, email }))}
              />
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--foreground)] text-sm font-semibold text-white">2</span>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Shipping address
              </h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Recipient" value={form.shippingRecipientName} required autoComplete="name" onChange={(shippingRecipientName) => setForm((current) => ({ ...current, shippingRecipientName }))} />
              <Field label="Phone" value={form.shippingPhone} autoComplete="tel" onChange={(shippingPhone) => setForm((current) => ({ ...current, shippingPhone }))} />
              <Field label="Address line 1" value={form.shippingLine1} required autoComplete="address-line1" className="md:col-span-2" onChange={(shippingLine1) => setForm((current) => ({ ...current, shippingLine1 }))} />
              <Field label="Address line 2" value={form.shippingLine2} autoComplete="address-line2" className="md:col-span-2" onChange={(shippingLine2) => setForm((current) => ({ ...current, shippingLine2 }))} />
              <Field label="City" value={form.shippingCity} required autoComplete="address-level2" onChange={(shippingCity) => setForm((current) => ({ ...current, shippingCity }))} />
              <Field label="Region" value={form.shippingRegion} required autoComplete="address-level1" onChange={(shippingRegion) => setForm((current) => ({ ...current, shippingRegion }))} />
              <Field label="Postal code" value={form.shippingPostalCode} required autoComplete="postal-code" onChange={(shippingPostalCode) => setForm((current) => ({ ...current, shippingPostalCode }))} />
              <Field label="Country" value={form.shippingCountry} required autoComplete="country" onChange={(shippingCountry) => setForm((current) => ({ ...current, shippingCountry: shippingCountry.toUpperCase() }))} />
            </div>
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--foreground)] text-sm font-semibold text-white">3</span>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Billing
              </h2>
            </div>
            <label className="mt-5 flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--background)] px-4 py-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.billingSameAsShipping}
                onChange={(event) => setForm((current) => ({ ...current, billingSameAsShipping: event.target.checked }))}
              />
              Billing address is the same as shipping
            </label>

            {!form.billingSameAsShipping ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Recipient" value={form.billingRecipientName} required onChange={(billingRecipientName) => setForm((current) => ({ ...current, billingRecipientName }))} />
                <Field label="Phone" value={form.billingPhone} onChange={(billingPhone) => setForm((current) => ({ ...current, billingPhone }))} />
                <Field label="Address line 1" value={form.billingLine1} required className="md:col-span-2" onChange={(billingLine1) => setForm((current) => ({ ...current, billingLine1 }))} />
                <Field label="Address line 2" value={form.billingLine2} className="md:col-span-2" onChange={(billingLine2) => setForm((current) => ({ ...current, billingLine2 }))} />
                <Field label="City" value={form.billingCity} required onChange={(billingCity) => setForm((current) => ({ ...current, billingCity }))} />
                <Field label="Region" value={form.billingRegion} required onChange={(billingRegion) => setForm((current) => ({ ...current, billingRegion }))} />
                <Field label="Postal code" value={form.billingPostalCode} required onChange={(billingPostalCode) => setForm((current) => ({ ...current, billingPostalCode }))} />
                <Field label="Country" value={form.billingCountry} required onChange={(billingCountry) => setForm((current) => ({ ...current, billingCountry: billingCountry.toUpperCase() }))} />
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--foreground)] text-sm font-semibold text-white">4</span>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Payment
              </h2>
            </div>
            <div className="mt-5 rounded-lg bg-[var(--teal-soft)] p-5">
              <p className="font-semibold text-[var(--teal)]">Mock payment provider</p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                This portfolio checkout creates an order and payment record without collecting card data.
              </p>
            </div>
          </section>

          {feedback ? (
            <p className="rounded-lg border border-[rgba(180,35,58,0.18)] bg-[rgba(180,35,58,0.08)] px-4 py-3 text-sm" style={{ color: "var(--rose)" }}>
              {feedback}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <Link href="/cart" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold">
              Back to cart
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[var(--foreground)] px-7 py-3 text-base font-semibold text-white transition hover:bg-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Placing order..." : "Place demo order"}
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] lg:sticky lg:top-32">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
            Order summary
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
            {formatCurrency(orderSummary.subtotal, orderSummary.currency)}
          </h2>

          <div className="mt-6 grid gap-3 border-y border-[var(--line)] py-5 text-sm">
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>Items</span>
              <strong>{orderSummary.itemCount}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>Product lines</span>
              <strong>{orderSummary.uniqueItemCount}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: "var(--muted)" }}>Subtotal</span>
              <strong>{formatCurrency(orderSummary.subtotal, orderSummary.currency)}</strong>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {cart.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--background)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {item.variant_name} / qty {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.line_total, item.currency)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-[var(--background)] p-4">
            <p className="font-semibold">Inventory reservation</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Stock is reserved when the order is placed, then reflected in admin and analytics views.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
