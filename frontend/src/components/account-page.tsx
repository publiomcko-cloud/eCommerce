"use client";

import Link from "next/link";

import { useAuth } from "@/app/providers";

export function AccountPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading your account
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Verifying the saved access token and pulling the current commerce profile.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Sign in to open the account area
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Stage 1 adds the protected customer shell first. Address CRUD and order history come in later stages.
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

  const customer = user.customer;

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
            Account shell
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Welcome back{customer?.first_name ? `, ${customer.first_name}` : ""}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
            This protected view proves the identity layer is working. Future stages will fill it with addresses,
            order history, and checkout-linked customer actions.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Auth identity
            </h2>
            <div className="mt-5 grid gap-3 text-sm">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Active:</strong> {user.is_active ? "yes" : "no"}</p>
              <p><strong>Last login:</strong> {user.last_login_at ?? "first session"}</p>
            </div>
          </article>

          <article className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Customer profile
            </h2>
            <div className="mt-5 grid gap-3 text-sm">
              <p><strong>First name:</strong> {customer?.first_name ?? "Not set yet"}</p>
              <p><strong>Last name:</strong> {customer?.last_name ?? "Not set yet"}</p>
              <p><strong>Phone:</strong> {customer?.phone ?? "Not set yet"}</p>
              <p><strong>Marketing opt-in:</strong> {customer?.marketing_opt_in ? "yes" : "no"}</p>
              <p><strong>Saved addresses:</strong> {customer?.addresses.length ?? 0}</p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
