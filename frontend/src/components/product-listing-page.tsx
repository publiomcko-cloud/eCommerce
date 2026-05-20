/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  fetchCatalogCategories,
  fetchCatalogProducts,
} from "@/lib/api";
import { formatCompactNumber, formatCurrency } from "@/lib/format";

function ProductListingSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="glass-panel overflow-hidden rounded-[30px]">
          <div className="h-56 animate-pulse bg-[rgba(23,49,63,0.08)]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[rgba(23,49,63,0.08)]" />
            <div className="h-6 w-40 animate-pulse rounded-full bg-[rgba(23,49,63,0.08)]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[rgba(23,49,63,0.08)]" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[rgba(23,49,63,0.08)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductListingPage() {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const deferredSearch = useDeferredValue(searchInput.trim());

  const categoriesQuery = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: fetchCatalogCategories,
  });

  const productsQuery = useQuery({
    queryKey: ["catalog-products", deferredSearch, selectedCategory],
    queryFn: () =>
      fetchCatalogProducts({
        q: deferredSearch || undefined,
        category: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 24,
      }),
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data?.items ?? [];
  const productCountLabel = useMemo(() => {
    const total = productsQuery.data?.total ?? 0;
    return `${formatCompactNumber(total)} product${total === 1 ? "" : "s"}`;
  }, [productsQuery.data?.total]);

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel overflow-hidden rounded-[40px] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex rounded-full bg-[var(--brass-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brass)]">
                Stage 2 storefront
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Browse the first real DataPulse Commerce catalog.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                This milestone adds categories, live stock-aware product cards, and product detail pages that sit beside
                the existing BI dashboard without disrupting it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[28px] border border-[var(--line)] bg-white/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Catalog status
                </p>
                <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
                  {productsQuery.data?.total ?? 0}
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Active products exposed by the public catalog API.
                </p>
              </article>
              <article className="rounded-[28px] border border-[var(--line)] bg-white/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Category map
                </p>
                <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
                  {categories.length}
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Seeded departments ready for storefront filtering.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[32px] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                Search products
              </span>
              <input
                value={searchInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => {
                    setSearchInput(nextValue);
                  });
                }}
                placeholder="Projector, mug, coffee..."
                className="rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                Category
              </span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{
                backgroundColor: selectedCategory === "all" ? "var(--foreground)" : "rgba(255, 255, 255, 0.72)",
                color: selectedCategory === "all" ? "var(--background)" : "var(--foreground)",
                border: selectedCategory === "all" ? "none" : "1px solid var(--line)",
              }}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.slug)}
                className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: selectedCategory === category.slug ? "var(--teal)" : "rgba(255, 255, 255, 0.72)",
                  color: selectedCategory === category.slug ? "#f9fbfb" : "var(--foreground)",
                  border: selectedCategory === category.slug ? "none" : "1px solid var(--line)",
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
              Public listing
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
              {productCountLabel}
              {deferredSearch ? ` matching "${deferredSearch}"` : ""}
            </p>
          </div>
          <Link
            href="/admin/products"
            className="rounded-full border border-[var(--line)] bg-white/65 px-4 py-2 text-sm font-semibold"
          >
            Open admin catalog
          </Link>
        </section>

        {productsQuery.isLoading ? <ProductListingSkeleton /> : null}

        {productsQuery.isError ? (
          <section className="glass-panel rounded-[32px] p-8 text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              The catalog could not be loaded
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Check the backend catalog routes or seed script, then refresh this page.
            </p>
          </section>
        ) : null}

        {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
          <section className="glass-panel rounded-[32px] p-8 text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              No products match the current filters
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Try another category or clear the search term to see the seeded storefront catalog.
            </p>
          </section>
        ) : null}

        {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="glass-panel group overflow-hidden rounded-[30px] transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="relative h-56 overflow-hidden border-b border-[var(--line)] bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(183,121,31,0.12))]">
                  {product.primary_image_url ? (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="h-full w-full object-contain p-10 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-10 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      No image
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
                    {product.category_name}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                        {product.name}
                      </h2>
                      <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                        {product.short_description ?? "Catalog item ready for later cart and checkout work."}
                      </p>
                    </div>
                    <div className="rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                      {product.variant_count} variants
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
                        {formatCurrency(product.price, product.currency)}
                      </p>
                      {product.compare_at_price ? (
                        <p className="mt-1 text-sm line-through" style={{ color: "var(--muted)" }}>
                          {formatCurrency(product.compare_at_price, product.currency)}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: product.is_in_stock ? "var(--teal)" : "var(--rose)" }}>
                      {product.is_in_stock ? `${product.available_stock} ready` : "Out of stock"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
