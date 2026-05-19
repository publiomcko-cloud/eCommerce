"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/app/providers";
import { login } from "@/lib/api";

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
      router.push("/account");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
            Stage 1
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Sign in to the commerce foundation.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
            This first auth slice adds customer identities without disturbing the BI dashboard and pipeline flows.
          </p>
          <p className="mt-6 text-sm leading-6" style={{ color: "var(--muted)" }}>
            No account yet? <Link href="/register" className="font-semibold text-[var(--teal)]">Create one here</Link>.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="glass-panel rounded-[32px] p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
            Login
          </h2>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            Use a customer or admin account to access protected commerce screens.
          </p>

          <div className="mt-6 grid gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
                required
              />
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
