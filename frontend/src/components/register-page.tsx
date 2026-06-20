"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/app/providers";
import { register } from "@/lib/api";

const INITIAL_FORM = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  marketingOptIn: false,
};

export function RegisterPage() {
  const router = useRouter();
  const { applyAuth } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await register({
        email: form.email,
        password: form.password,
        first_name: form.firstName || undefined,
        last_name: form.lastName || undefined,
        phone: form.phone || undefined,
        marketing_opt_in: form.marketingOptIn,
      });
      applyAuth(response);
      router.push("/account");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to register.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow)] lg:grid-cols-[0.9fr_1fr]">
        <section className="bg-[var(--foreground)] p-6 text-white sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Create account</p>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Start shopping with a customer profile.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/90">
            Create an account to keep your cart, use demo checkout, and inspect order history after purchase.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="rounded-lg border border-white/15 p-4">
              <p className="font-semibold">Mock payments only</p>
              <p className="mt-2 text-sm leading-6 text-white/85">No card details are collected in this portfolio store.</p>
            </div>
            <div className="rounded-lg border border-white/15 p-4">
              <p className="font-semibold">Inventory-backed cart</p>
              <p className="mt-2 text-sm leading-6 text-white/85">Orders reserve stock and feed admin operations.</p>
            </div>
          </div>

          <p className="mt-8 text-sm leading-6 text-white/85">
            Already have an account? <Link href="/login" className="font-semibold text-white">Sign in</Link>.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
            Customer details
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
            Create your account.
          </h2>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Email
              </span>
              <input
                type="email"
                value={form.email}
                autoComplete="email"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                First name
              </span>
              <input
                value={form.firstName}
                autoComplete="given-name"
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Last name
              </span>
              <input
                value={form.lastName}
                autoComplete="family-name"
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Phone
              </span>
              <input
                value={form.phone}
                autoComplete="tel"
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Password
              </span>
              <input
                type="password"
                value={form.password}
                autoComplete="new-password"
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                minLength={8}
                required
              />
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--background)] px-4 py-3 md:col-span-2">
              <input
                type="checkbox"
                checked={form.marketingOptIn}
                onChange={(event) => setForm((current) => ({ ...current, marketingOptIn: event.target.checked }))}
              />
              <span className="text-sm">Send me demo store updates.</span>
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-[rgba(180,35,58,0.18)] bg-[rgba(180,35,58,0.08)] px-4 py-3 text-sm" style={{ color: "var(--rose)" }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
