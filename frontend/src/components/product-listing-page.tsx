"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  fetchCatalogCategories,
  fetchCatalogProducts,
  type ProductCardResponse,
} from "@/lib/api";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import { ProductVisual } from "@/components/product-visual";

function ProductListingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-[var(--line)] bg-white">
          <div className="aspect-[4/3] animate-pulse bg-[var(--ink-soft)]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--ink-soft)]" />
            <div className="h-7 w-44 animate-pulse rounded-full bg-[var(--ink-soft)]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[var(--ink-soft)]" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--ink-soft)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductMedia({ product }: { product: ProductCardResponse }) {
  return (
    <ProductVisual
      name={product.name}
      imageUrl={product.primary_image_url}
      categoryName={product.category_name}
      imageClassName="h-full w-full object-contain p-8 transition-transform duration-300 group-hover:scale-105"
    />
  );
}

function ProductCard({ product }: { product: ProductCardResponse }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group grid overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(29,39,33,0.06)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
    >
      <div className="relative aspect-[4/3] border-b border-[var(--line)]">
        <ProductMedia product={product} />
        <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold">
          {product.category_name}
        </div>
        <div
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: product.is_in_stock ? "var(--teal-soft)" : "rgba(180, 35, 58, 0.1)",
            color: product.is_in_stock ? "var(--teal)" : "var(--rose)",
          }}
        >
          {product.is_in_stock ? "In stock" : "Out of stock"}
        </div>
      </div>

      <div className="grid min-h-[260px] content-between gap-5 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
            {product.brand ? <span>{product.brand}</span> : null}
            <span>{product.variant_count} variant{product.variant_count === 1 ? "" : "s"}</span>
          </div>
          <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
            {product.name}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            {product.short_description ?? "Inventory-backed demo product ready for checkout."}
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
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
            <p className="text-right text-xs font-semibold" style={{ color: "var(--muted)" }}>
              {product.is_in_stock ? `${product.available_stock} available` : "Unavailable"}
            </p>
          </div>

          <span className="rounded-full bg-[var(--foreground)] px-4 py-3 text-center text-sm font-semibold text-white transition group-hover:bg-[var(--teal)]">
            View product
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductListingPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [availability, setAvailability] = useState<"all" | "in-stock">("all");
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
        limit: 48,
      }),
  });

  const categories = categoriesQuery.data ?? [];
  const products = useMemo(() => {
    const items = productsQuery.data?.items ?? [];
    if (availability === "in-stock") {
      return items.filter((product) => product.is_in_stock);
    }
    return items;
  }, [availability, productsQuery.data?.items]);
  const totalProducts = productsQuery.data?.total ?? 0;
  const selectedCategoryName =
    selectedCategory === "all"
      ? "All departments"
      : categories.find((category) => category.slug === selectedCategory)?.name ?? "Selected department";
  const productCountLabel = `${formatCompactNumber(products.length)} product${products.length === 1 ? "" : "s"}`;

  function clearFilters() {
    setSearchInput("");
    setSelectedCategory("all");
    setAvailability("all");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8">
        <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow)]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
                Store catalog
              </p>
              <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Find products ready for demo checkout.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: "var(--muted)" }}>
                Browse departments, compare prices, check availability, and open each product for variant selection and cart actions.
              </p>
            </div>

            <div className="grid border-t border-[var(--line)] bg-[var(--foreground)] p-6 text-white sm:grid-cols-3 lg:border-l lg:border-t-0 lg:p-8">
              <div className="border-white/15 py-3 sm:border-r sm:px-4">
                <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold">{totalProducts}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">Products</p>
              </div>
              <div className="border-white/15 py-3 sm:border-r sm:px-4">
                <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold">{categories.length}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">Departments</p>
              </div>
              <div className="py-3 sm:px-4">
                <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold">
                  {products.filter((product) => product.is_in_stock).length}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">Available</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-[0_10px_30px_rgba(29,39,33,0.05)] lg:sticky lg:top-32">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">Filters</h2>
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-[var(--teal)]">
                Clear
              </button>
            </div>

            <label className="mt-5 grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Search
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
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
              />
            </label>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Department
              </p>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold"
                  style={{
                    backgroundColor: selectedCategory === "all" ? "var(--foreground)" : "var(--background)",
                    color: selectedCategory === "all" ? "white" : "var(--foreground)",
                  }}
                >
                  All departments
                  <span>{totalProducts}</span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.slug)}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold"
                    style={{
                      backgroundColor: selectedCategory === category.slug ? "var(--teal)" : "var(--background)",
                      color: selectedCategory === category.slug ? "white" : "var(--foreground)",
                    }}
                  >
                    {category.name}
                    <span>{category.product_count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Availability
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "in-stock", label: "In stock" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAvailability(option.value as "all" | "in-stock")}
                    className="rounded-lg px-3 py-2 text-sm font-semibold"
                    style={{
                      backgroundColor: availability === option.value ? "var(--foreground)" : "var(--background)",
                      color: availability === option.value ? "white" : "var(--foreground)",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="grid gap-5">
            <div className="flex flex-col justify-between gap-4 rounded-lg border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--teal)]">{selectedCategoryName}</p>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Showing {productCountLabel}
                  {deferredSearch ? ` matching "${deferredSearch}"` : ""}
                  {availability === "in-stock" ? " with available inventory" : ""}
                </p>
              </div>
              <Link href="/cart" className="rounded-full border border-[var(--line)] px-5 py-3 text-center text-sm font-semibold">
                View cart
              </Link>
            </div>

            {productsQuery.isLoading ? <ProductListingSkeleton /> : null}

            {productsQuery.isError || categoriesQuery.isError ? (
              <section className="rounded-lg border border-[var(--line)] bg-white p-8 text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  The catalog could not be loaded
                </h2>
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Check the backend catalog routes or seed script, then refresh this page.
                </p>
              </section>
            ) : null}

            {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
              <section className="rounded-lg border border-[var(--line)] bg-white p-8 text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  No products match these filters
                </h2>
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Clear filters or choose another department to keep browsing.
                </p>
              </section>
            ) : null}

            {!productsQuery.isLoading && !productsQuery.isError && products.length > 0 ? (
              <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
