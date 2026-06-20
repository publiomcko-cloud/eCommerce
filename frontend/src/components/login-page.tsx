"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/app/providers";
import { login } from "@/lib/api";

const DEMO_LOGIN_OPTIONS = [
  {
    role: "Customer",
    description: "Shop products, checkout, and view account orders.",
    email: "customer@datapulse.local",
    password: "customer123-local-only",
  },
  {
    role: "Admin",
    description: "Manage products, orders, inventory, and analytics.",
    email: "admin@datapulse.local",
    password: "admin123-local-only",
  },
];

export function LoginPage() {
  const router = useRouter();
  const { applyAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await login({ email, password });
      applyAuth(response);
      router.push(response.user.role === "admin" ? "/admin" : "/account");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillCredentials(emailValue: string, passwordValue: string) {
    setEmail(emailValue);
    setPassword(passwordValue);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow)] lg:grid-cols-[1fr_0.9fr]">
        <section className="flex min-h-[560px] flex-col justify-between bg-[var(--foreground)] p-6 text-white sm:p-8 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/85">Customer account</p>
            <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Welcome back to DataPulse Commerce.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/90">
              Sign in to keep your cart, place demo orders, and review your customer order history.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/15 p-4">
              <p className="font-semibold">Saved cart</p>
              <p className="mt-2 text-sm leading-6 text-white/85">Continue shopping across sessions.</p>
            </div>
            <div className="rounded-lg border border-white/15 p-4">
              <p className="font-semibold">Demo checkout</p>
              <p className="mt-2 text-sm leading-6 text-white/85">Place safe mock-payment orders.</p>
            </div>
            <div className="rounded-lg border border-white/15 p-4">
              <p className="font-semibold">Order history</p>
              <p className="mt-2 text-sm leading-6 text-white/85">Track previous purchases.</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid content-center p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
            Sign in
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
            Access your store account.
          </h2>
          <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
            New here? <Link href="/register" className="font-semibold text-[var(--teal)]">Create a customer account</Link>.
          </p>

          <div className="mt-6 grid gap-3">
            {DEMO_LOGIN_OPTIONS.map((option) => (
              <button
                key={option.role}
                type="button"
                onClick={() => fillCredentials(option.email, option.password)}
                className="rounded-lg border border-[#111827] bg-white p-4 text-left text-[#111827] transition hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-[#005f55] focus:ring-offset-2"
              >
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-[family-name:var(--font-heading)] text-lg font-semibold">
                    {option.role} demo
                  </span>
                  <span className="rounded-full bg-[#111827] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                    Autofill
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-6" style={{ color: "var(--muted)" }}>
                  {option.description}
                </span>
                <span className="mt-3 grid gap-1 text-xs font-semibold sm:grid-cols-2">
                  <span className="break-all rounded-md bg-[var(--background)] px-3 py-2">
                    {option.email}
                  </span>
                  <span className="break-all rounded-md bg-[var(--background)] px-3 py-2">
                    {option.password}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-7 grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Email
              </span>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                Password
              </span>
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                required
              />
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <Link
            href="/products"
            className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#111827] bg-[#111827] px-5 py-3 text-center text-sm font-semibold !text-white transition hover:border-[#005f55] hover:bg-[#005f55]"
            style={{ color: "#ffffff" }}
          >
            Continue shopping
          </Link>
        </form>
      </div>
    </main>
  );
}
