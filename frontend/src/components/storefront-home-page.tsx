"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import {
  fetchCatalogCategories,
  fetchCatalogProducts,
  type CatalogCategoryResponse,
  type ProductCardResponse,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { ProductVisual } from "@/components/product-visual";

function ProductImage({ product, priority = false }: { product: ProductCardResponse; priority?: boolean }) {
  return (
    <ProductVisual
      name={product.name}
      imageUrl={product.primary_image_url}
      categoryName={product.category_name}
      priority={priority}
    />
  );
}

function StockBadge({ product }: { product: ProductCardResponse }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: product.is_in_stock ? "var(--teal-soft)" : "rgba(180, 35, 58, 0.1)",
        color: product.is_in_stock ? "var(--teal)" : "var(--rose)",
      }}
    >
      {product.is_in_stock ? `${product.available_stock} in stock` : "Out of stock"}
    </span>
  );
}

function FeaturedProductCard({ product }: { product: ProductCardResponse }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group grid overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow)] transition hover:-translate-y-0.5"
    >
      <div className="aspect-[4/3]">
        <ProductImage product={product} />
      </div>
      <div className="grid min-h-[230px] content-between gap-5 p-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
              {product.category_name}
            </p>
            <StockBadge product={product} />
          </div>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
            {product.short_description ?? "Demo catalog product with inventory-backed checkout."}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              {formatCurrency(product.price, product.currency)}
            </p>
            {product.compare_at_price ? (
              <p className="text-sm line-through" style={{ color: "var(--muted)" }}>
                {formatCurrency(product.compare_at_price, product.currency)}
              </p>
            ) : null}
          </div>
          <span className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[var(--teal)]">
            View product
          </span>
        </div>
      </div>
    </Link>
  );
}

function CategoryTile({ category }: { category: CatalogCategoryResponse }) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="rounded-lg border border-[var(--line)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
            {category.name}
          </h3>
          <p className="mt-2 min-h-12 text-sm leading-6" style={{ color: "var(--muted)" }}>
            {category.description ?? "Explore this department."}
          </p>
        </div>
        <span className="rounded-full bg-[var(--ink-soft)] px-3 py-1 text-xs font-semibold">
          {category.product_count}
        </span>
      </div>
    </Link>
  );
}

function HomeSkeleton() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <div className="h-[520px] animate-pulse rounded-lg bg-white" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-lg bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}

export function StorefrontHomePage() {
  const categoriesQuery = useQuery({
    queryKey: ["home-catalog-categories"],
    queryFn: fetchCatalogCategories,
  });

  const productsQuery = useQuery({
    queryKey: ["home-featured-products"],
    queryFn: () => fetchCatalogProducts({ limit: 6 }),
  });

  const products = productsQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];
  const heroProduct = products[0];
  const featuredProducts = products.slice(1, 4);

  const productCount = productsQuery.data?.total ?? products.length;
  const availableCount = products.filter((product) => product.is_in_stock).length;
  const catalogStats = [
    { label: "Demo products", value: productCount.toString() },
    { label: "Departments", value: categories.length.toString() },
    { label: "Ready to ship", value: availableCount.toString() },
  ];

  if (productsQuery.isLoading || categoriesQuery.isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="flex min-h-[520px] flex-col justify-between rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-8 lg:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
                Inventory-backed demo store
              </p>
              <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-heading)] text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Shop the DataPulse demo catalog.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                Browse real catalog records, add products to a persistent cart, and complete a safe mock checkout that
                feeds the admin and analytics layers.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="rounded-full border border-[#111827] bg-[#111827] px-6 py-3 text-sm font-semibold !text-white shadow-[0_10px_24px_rgba(17,24,39,0.22)] transition hover:border-[#005f55] hover:bg-[#005f55]"
                  style={{ color: "#ffffff" }}
                >
                  Shop products
                </Link>
                <Link
                  href="/cart"
                  className="rounded-full border border-[#111827] bg-white px-6 py-3 text-sm font-semibold text-[#111827] transition hover:bg-[#f3f4f6]"
                >
                  View cart
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {catalogStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[var(--line)] bg-[var(--background)] p-4">
                  <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow)]">
            {heroProduct ? (
              <Link href={`/products/${heroProduct.slug}`} className="group grid h-full">
                <div className="relative min-h-[320px] border-b border-[var(--line)] lg:min-h-[390px]">
                  <ProductImage product={heroProduct} priority />
                  <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
                    Featured
                  </div>
                </div>
                <div className="grid gap-6 p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                      {heroProduct.category_name}
                    </p>
                    <StockBadge product={heroProduct} />
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight sm:text-4xl">
                      {heroProduct.name}
                    </h2>
                    <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                      {heroProduct.short_description ?? "Featured storefront product."}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
                        {formatCurrency(heroProduct.price, heroProduct.currency)}
                      </p>
                      {heroProduct.compare_at_price ? (
                        <p className="mt-1 text-sm line-through" style={{ color: "var(--muted)" }}>
                          {formatCurrency(heroProduct.compare_at_price, heroProduct.currency)}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-[var(--foreground)]">
                      View product
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="grid h-full min-h-[520px] place-items-center p-8 text-center">
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
                    Catalog is empty
                  </h2>
                  <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                    Run the commerce seed script to load demo storefront products.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
              Why this store works
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              A storefront connected to operations.
            </h2>
          </div>
          <div className="rounded-lg bg-[var(--background)] p-5">
            <h3 className="font-semibold">Inventory-aware checkout</h3>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Product availability comes from the same inventory tables used by admin operations.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--background)] p-5">
            <h3 className="font-semibold">Safe demo payment</h3>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Checkout uses a mock provider, so no real payment data is collected or stored.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
                Departments
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
                Shop by category
              </h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-[var(--teal)]">
              Browse all products
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.slice(0, 4).map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--teal)" }}>
                Featured products
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
                Ready for the cart
              </h2>
            </div>
            <Link href="/products" className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold">
              View catalog
            </Link>
          </div>

          {productsQuery.isError || categoriesQuery.isError ? (
            <div className="mt-6 rounded-lg border border-[var(--line)] bg-white p-8 text-center">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Storefront data could not be loaded
              </h3>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Check that the backend is running and the catalog seed has been applied.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(featuredProducts.length > 0 ? featuredProducts : products.slice(0, 3)).map((product) => (
              <FeaturedProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
