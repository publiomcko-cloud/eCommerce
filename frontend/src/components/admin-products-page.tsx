"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import { fetchAdminProducts, fetchCatalogCategories } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function AdminProductsPage() {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categoriesQuery = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: fetchCatalogCategories,
    enabled: !isLoading,
  });

  const productsQuery = useQuery({
    queryKey: ["admin-products", token, statusFilter, categoryFilter],
    queryFn: () =>
      fetchAdminProducts(token ?? "", {
        status: statusFilter === "all" ? undefined : statusFilter,
        category_id: categoryFilter === "all" ? undefined : categoryFilter,
      }),
    enabled: Boolean(token && user?.role === "admin"),
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-lg border border-[var(--line)] bg-white px-6 py-20 text-center shadow-[var(--shadow)]">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading admin workspace
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Checking the authenticated role before opening catalog management.
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
              The admin catalog APIs are protected. Sign in with an admin account to create or update products and
              inventory.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
              >
                Login
              </Link>
              <Link
                href="/products"
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
              >
                Browse storefront
              </Link>
            </div>
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
                Catalog management
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Manage products, variants, and stock from the commerce back office.
              </h1>
              <p className="mt-4 text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                Manage storefront products, variants, publication status, and stock visibility from the back office.
              </p>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
            >
              Create product
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                Category
              </span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
              >
                <option value="all">All categories</option>
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {productsQuery.isError ? (
          <section className="rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Admin products could not be loaded
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Confirm the backend is running and that your admin token is still valid.
            </p>
          </section>
        ) : null}

        {productsQuery.isLoading ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
                <div className="h-3 w-20 animate-pulse rounded-full bg-[rgba(23,49,63,0.08)]" />
                <div className="mt-4 h-6 w-36 animate-pulse rounded-full bg-[rgba(23,49,63,0.08)]" />
                <div className="mt-5 h-3 w-full animate-pulse rounded-full bg-[rgba(23,49,63,0.08)]" />
              </div>
            ))}
          </section>
        ) : null}

        {!productsQuery.isLoading && !productsQuery.isError && (productsQuery.data?.items.length ?? 0) === 0 ? (
          <section className="rounded-lg border border-[var(--line)] bg-white p-8 text-center shadow-[0_10px_30px_rgba(29,39,33,0.05)]">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              No products match this admin filter
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Create a product or widen the filters to see more of the catalog.
            </p>
          </section>
        ) : null}

        {!productsQuery.isLoading && !productsQuery.isError && (productsQuery.data?.items.length ?? 0) > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {productsQuery.data?.items.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      {product.category_name}
                    </p>
                    <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                      {product.name}
                    </h2>
                  </div>
                  <div
                    className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{
                      backgroundColor:
                        product.status === "active"
                          ? "rgba(15, 118, 110, 0.12)"
                          : product.status === "draft"
                            ? "rgba(183, 121, 31, 0.14)"
                            : "rgba(180, 83, 79, 0.14)",
                      color:
                        product.status === "active"
                          ? "var(--teal)"
                          : product.status === "draft"
                            ? "var(--brass)"
                            : "var(--rose)",
                    }}
                  >
                    {product.status}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <p><strong>Slug:</strong> {product.slug}</p>
                  <p><strong>Variants:</strong> {product.variant_count}</p>
                  <p><strong>Available stock:</strong> {product.total_available_stock}</p>
                  <p><strong>Updated:</strong> {formatDateTime(product.updated_at)}</p>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
