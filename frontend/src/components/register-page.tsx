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
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--brass-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brass)]">
            Customer setup
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Create the first commerce account layer.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
            Registration now creates a customer identity and profile on top of the BI baseline so later stages can
            connect catalog, cart, and checkout to real users.
          </p>
          <p className="mt-6 text-sm leading-6" style={{ color: "var(--muted)" }}>
            Already registered? <Link href="/login" className="font-semibold text-[var(--teal)]">Sign in here</Link>.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="glass-panel rounded-[32px] p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
            Registration
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            This is the first customer-facing commerce entry point in the project roadmap.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                First name
              </span>
              <input
                value={form.firstName}
                onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Last name
              </span>
              <input
                value={form.lastName}
                onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Phone
              </span>
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Password
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                minLength={8}
                required
              />
            </label>

            <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3">
              <input
                type="checkbox"
                checked={form.marketingOptIn}
                onChange={(event) => setForm((current) => ({ ...current, marketingOptIn: event.target.checked }))}
              />
              <span className="text-sm" style={{ color: "var(--foreground)" }}>
                Allow marketing updates in the demo customer profile.
              </span>
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-[rgba(180,83,79,0.2)] bg-[rgba(180,83,79,0.08)] px-4 py-3 text-sm" style={{ color: "var(--rose)" }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-base font-semibold text-[var(--background)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
