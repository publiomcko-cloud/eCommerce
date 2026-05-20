/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useCart } from "@/app/providers";
import { fetchCatalogProduct } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

type ProductDetailPageProps = {
  slug: string;
};

function formatAttributes(attributes: Record<string, unknown>) {
  return Object.entries(attributes)
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`)
    .join(" • ");
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const productQuery = useQuery({
    queryKey: ["catalog-product", slug],
    queryFn: () => fetchCatalogProduct(slug),
  });

  const product = productQuery.data;
  const selectedVariant = useMemo(() => {
    if (!product?.variants.length) {
      return null;
    }
    return product.variants.find((variant) => variant.id === selectedVariantId) ?? product.variants[0];
  }, [product, selectedVariantId]);

  async function handleAddToCart() {
    if (!selectedVariant) {
      return;
    }

    setFeedback(null);
    setIsAddingToCart(true);
    try {
      await addItem({
        variant_id: selectedVariant.id,
        quantity,
      });
      setFeedback("Added to cart.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to add this item to the cart.");
    } finally {
      setIsAddingToCart(false);
    }
  }

  if (productQuery.isLoading) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading product detail
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Pulling variants, stock status, and catalog imagery from the new commerce API.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Product not available
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              The slug either does not exist or the product is not active in the public catalog.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
            >
              Back to products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Link href="/products" className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
          ← Back to products
        </Link>

        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(183,121,31,0.14))]">
                {product.images[0]?.url ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt_text ?? product.name}
                    className="h-[380px] w-full object-contain p-12"
                  />
                ) : (
                  <div className="flex h-[380px] items-center justify-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                    No image available
                  </div>
                )}
              </div>
              {product.images.length > 1 ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {product.images.slice(1).map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white/70">
                      <img src={image.url} alt={image.alt_text ?? product.name} className="h-28 w-full object-contain p-6" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
                {product.category.name}
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                {product.name}
              </h1>
              <p className="mt-4 text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                {product.description ?? product.short_description ?? "Catalog detail is ready for the next checkout stages."}
              </p>

              <div className="mt-6 flex flex-wrap items-end gap-5">
                <div>
                  <p className="font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight">
                    {formatCurrency(selectedVariant?.effective_price ?? product.price, product.currency)}
                  </p>
                  {product.compare_at_price ? (
                    <p className="mt-1 text-sm line-through" style={{ color: "var(--muted)" }}>
                      {formatCurrency(product.compare_at_price, product.currency)}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: selectedVariant?.is_in_stock ? "var(--teal)" : "var(--rose)" }}>
                  {selectedVariant?.is_in_stock
                    ? `${selectedVariant.available_stock} units ready`
                    : selectedVariant?.allow_backorder
                      ? "Backorder available"
                      : "Unavailable"}
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                  Choose variant
                </h2>
                <div className="mt-3 grid gap-3">
                  {product.variants.map((variant) => {
                    const isActive = variant.id === selectedVariant?.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className="rounded-[24px] border px-4 py-4 text-left transition"
                        style={{
                          borderColor: isActive ? "var(--teal)" : "var(--line)",
                          backgroundColor: isActive ? "rgba(15, 118, 110, 0.09)" : "rgba(255, 255, 255, 0.62)",
                        }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">{variant.name}</p>
                            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                              SKU {variant.sku}
                            </p>
                            {Object.keys(variant.attributes).length > 0 ? (
                              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                                {formatAttributes(variant.attributes)}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                              {formatCurrency(variant.effective_price, product.currency)}
                            </p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: variant.is_in_stock ? "var(--teal)" : "var(--rose)" }}>
                              {variant.is_in_stock ? `${variant.available_stock} available` : "Out of stock"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-white/70 p-5">
                <div className="grid gap-4 lg:grid-cols-[0.45fr_1fr] lg:items-end">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      Quantity
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                      className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                    />
                  </label>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => void handleAddToCart()}
                      disabled={isAddingToCart || (!selectedVariant?.is_in_stock && !selectedVariant?.allow_backorder)}
                      className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-base font-semibold text-[var(--background)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAddingToCart ? "Adding..." : "Add to cart"}
                    </button>
                    <div className="flex flex-wrap gap-3 text-sm" style={{ color: "var(--muted)" }}>
                      <span>Stage 3 now supports guest and customer carts.</span>
                      <Link href="/cart" className="font-semibold text-[var(--teal)]">
                        Open cart
                      </Link>
                    </div>
                  </div>
                </div>
                {feedback ? (
                  <p className="mt-4 text-sm leading-6" style={{ color: feedback === "Added to cart." ? "var(--teal)" : "var(--rose)" }}>
                    {feedback}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
