"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useCart } from "@/app/providers";
import { fetchCatalogProduct } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { ProductVisual } from "@/components/product-visual";

type ProductDetailPageProps = {
  slug: string;
};

function formatAttributes(attributes: Record<string, unknown>) {
  return Object.entries(attributes)
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`)
    .join(" / ");
}

function QuantityButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-white text-lg font-semibold transition hover:border-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
  const activeImage = product?.images[selectedImageIndex] ?? product?.images[0] ?? null;
  const maxQuantity = selectedVariant?.allow_backorder ? 99 : Math.max(1, selectedVariant?.available_stock ?? 1);
  const canAddToCart = Boolean(selectedVariant && (selectedVariant.is_in_stock || selectedVariant.allow_backorder));
  const displayPrice = selectedVariant?.effective_price ?? product?.price ?? 0;

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.min(maxQuantity, Math.max(1, nextQuantity)));
  }

  async function handleAddToCart() {
    if (!selectedVariant || !canAddToCart) {
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
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="h-[560px] animate-pulse rounded-lg bg-white" />
          <div className="h-[560px] animate-pulse rounded-lg bg-white" />
        </div>
      </main>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-lg border border-[var(--line)] bg-white px-6 py-20 text-center shadow-[var(--shadow)]">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Product not available
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              This product is no longer active in the public catalog.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6">
        <nav className="flex flex-wrap items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
          <Link href="/" className="font-semibold hover:text-[var(--foreground)]">
            Store
          </Link>
          <span>/</span>
          <Link href="/products" className="font-semibold hover:text-[var(--foreground)]">
            Products
          </Link>
          <span>/</span>
          <Link href={`/products?category=${product.category.slug}`} className="font-semibold hover:text-[var(--foreground)]">
            {product.category.name}
          </Link>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow)]">
              <div className="relative aspect-[1.05/1] min-h-[360px] bg-[var(--ink-soft)]">
                <ProductVisual
                  name={product.name}
                  imageUrl={activeImage?.url}
                  categoryName={product.category.name}
                  imageClassName="h-full w-full object-contain p-10 sm:p-14"
                />
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
                  {product.category.name}
                </div>
              </div>
            </div>

            {product.images.length > 1 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {product.images.map((image, index) => {
                  const isSelected = index === selectedImageIndex;
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className="overflow-hidden rounded-lg border bg-white transition hover:-translate-y-0.5"
                      style={{ borderColor: isSelected ? "var(--teal)" : "var(--line)" }}
                    >
                      <ProductVisual
                        name={product.name}
                        imageUrl={image.url}
                        categoryName={product.category.name}
                        className="aspect-square w-full"
                        imageClassName="aspect-square w-full object-contain p-4"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--line)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                  Inventory
                </p>
                <p className="mt-2 font-semibold text-[var(--teal)]">
                  {selectedVariant?.is_in_stock ? `${selectedVariant.available_stock} available` : "Unavailable"}
                </p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                  Payment
                </p>
                <p className="mt-2 font-semibold">Mock checkout</p>
              </div>
              <div className="rounded-lg border border-[var(--line)] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                  Fulfillment
                </p>
                <p className="mt-2 font-semibold">Demo shipment</p>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)] sm:p-8 lg:sticky lg:top-32">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold text-[var(--teal)]">
                {product.category.name}
              </span>
              {product.brand ? (
                <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold">
                  {product.brand}
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              {product.description ?? product.short_description ?? "Inventory-backed product available for demo checkout."}
            </p>

            <div className="mt-6 border-y border-[var(--line)] py-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-[family-name:var(--font-heading)] text-5xl font-semibold tracking-tight">
                    {formatCurrency(displayPrice, product.currency)}
                  </p>
                  {product.compare_at_price ? (
                    <p className="mt-1 text-sm line-through" style={{ color: "var(--muted)" }}>
                      {formatCurrency(product.compare_at_price, product.currency)}
                    </p>
                  ) : null}
                </div>
                <span
                  className="rounded-full px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: selectedVariant?.is_in_stock ? "var(--teal-soft)" : "rgba(180, 35, 58, 0.1)",
                    color: selectedVariant?.is_in_stock ? "var(--teal)" : "var(--rose)",
                  }}
                >
                  {selectedVariant?.is_in_stock
                    ? `${selectedVariant.available_stock} in stock`
                    : selectedVariant?.allow_backorder
                      ? "Backorder"
                      : "Out of stock"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Select variant
              </h2>
              <div className="mt-3 grid gap-3">
                {product.variants.map((variant) => {
                  const isActive = variant.id === selectedVariant?.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                        setFeedback(null);
                      }}
                      className="rounded-lg border px-4 py-4 text-left transition hover:border-[var(--teal)]"
                      style={{
                        borderColor: isActive ? "var(--teal)" : "var(--line)",
                        backgroundColor: isActive ? "var(--teal-soft)" : "var(--background)",
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
                        <div className="text-left sm:text-right">
                          <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                            {formatCurrency(variant.effective_price, product.currency)}
                          </p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: variant.is_in_stock ? "var(--teal)" : "var(--rose)" }}>
                            {variant.is_in_stock ? `${variant.available_stock} available` : "Out of stock"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                Quantity
              </h2>
              <div className="flex items-center gap-3">
                <QuantityButton disabled={quantity <= 1} onClick={() => updateQuantity(quantity - 1)}>
                  -
                </QuantityButton>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(event) => updateQuantity(Number(event.target.value) || 1)}
                  className="h-11 w-20 rounded-full border border-[var(--line)] bg-white text-center text-sm font-semibold outline-none transition focus:border-[var(--teal)]"
                />
                <QuantityButton disabled={quantity >= maxQuantity} onClick={() => updateQuantity(quantity + 1)}>
                  +
                </QuantityButton>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => void handleAddToCart()}
                disabled={isAddingToCart || !canAddToCart}
                className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-base font-semibold text-white transition hover:bg-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAddingToCart ? "Adding..." : "Add to cart"}
              </button>
              <Link
                href="/cart"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--line)] px-6 py-3 text-base font-semibold transition hover:border-[var(--foreground)]"
              >
                View cart
              </Link>
              <Link
                href="/products"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#111827] bg-[#111827] px-5 py-3 text-center text-sm font-semibold !text-white transition hover:border-[#005f55] hover:bg-[#005f55]"
                style={{ color: "#ffffff" }}
              >
                Continue shopping
              </Link>
            </div>

            {feedback ? (
              <p
                className="mt-4 rounded-lg px-4 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: feedback === "Added to cart." ? "var(--teal-soft)" : "rgba(180, 35, 58, 0.1)",
                  color: feedback === "Added to cart." ? "var(--teal)" : "var(--rose)",
                }}
              >
                {feedback}
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 border-t border-[var(--line)] pt-6">
              <div>
                <p className="font-semibold">Safe demo checkout</p>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  No real card data is collected. Payments are simulated by the mock provider.
                </p>
              </div>
              <div>
                <p className="font-semibold">Inventory-backed order flow</p>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Stock is validated before checkout and reserved when the order is placed.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
