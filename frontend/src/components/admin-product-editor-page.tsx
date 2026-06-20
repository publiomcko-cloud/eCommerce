"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/app/providers";
import {
  AdminProductImageInput,
  AdminProductResponse,
  AdminProductUpsertInput,
  AdminProductVariantInput,
  adjustAdminInventory,
  createAdminProduct,
  fetchAdminProduct,
  fetchCatalogCategories,
  InventoryAdjustmentInput,
  updateAdminProduct,
} from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

type AdminProductEditorPageProps = {
  productId?: string;
};

type EditableImage = AdminProductImageInput & {
  key: string;
};

type EditableVariant = Omit<AdminProductVariantInput, "attributes" | "price" | "weight_grams"> & {
  key: string;
  attributesText: string;
  price: string;
  weight_grams: string;
};

type ProductFormState = {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  status: "draft" | "active" | "archived";
  brand: string;
  base_price: string;
  compare_at_price: string;
  currency: string;
  seo_title: string;
  seo_description: string;
  images: EditableImage[];
  variants: EditableVariant[];
};

type AdjustmentDraftState = Record<string, { quantity_delta: string; reason: string }>;

function makeKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyImage(): EditableImage {
  return {
    key: makeKey("image"),
    url: "",
    alt_text: "",
    sort_order: 0,
    is_primary: true,
  };
}

function createEmptyVariant(): EditableVariant {
  return {
    key: makeKey("variant"),
    sku: "",
    name: "",
    attributesText: "{}",
    price: "",
    weight_grams: "",
    status: "active",
    stock_on_hand: 0,
    stock_reserved: 0,
    low_stock_threshold: 5,
    allow_backorder: false,
  };
}

function createInitialState(): ProductFormState {
  return {
    category_id: "",
    name: "",
    slug: "",
    description: "",
    short_description: "",
    status: "draft",
    brand: "",
    base_price: "",
    compare_at_price: "",
    currency: "BRL",
    seo_title: "",
    seo_description: "",
    images: [createEmptyImage()],
    variants: [createEmptyVariant()],
  };
}

function mapProductToForm(product: AdminProductResponse): ProductFormState {
  return {
    category_id: product.category_id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    short_description: product.short_description ?? "",
    status: product.status,
    brand: product.brand ?? "",
    base_price: String(product.base_price),
    compare_at_price: product.compare_at_price === null ? "" : String(product.compare_at_price),
    currency: product.currency,
    seo_title: product.seo_title ?? "",
    seo_description: product.seo_description ?? "",
    images:
      product.images.length > 0
        ? product.images.map((image) => ({
            key: makeKey("image"),
            url: image.url,
            alt_text: image.alt_text ?? "",
            sort_order: image.sort_order,
            is_primary: image.is_primary,
          }))
        : [createEmptyImage()],
    variants:
      product.variants.length > 0
        ? product.variants.map((variant) => ({
            key: makeKey("variant"),
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            attributesText: JSON.stringify(variant.attributes, null, 2),
            price: variant.price === null ? "" : String(variant.price),
            weight_grams: variant.weight_grams === null ? "" : String(variant.weight_grams),
            status: variant.status,
            stock_on_hand: variant.inventory.stock_on_hand,
            stock_reserved: variant.inventory.stock_reserved,
            low_stock_threshold: variant.inventory.low_stock_threshold,
            allow_backorder: variant.inventory.allow_backorder,
          }))
        : [createEmptyVariant()],
  };
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }
  return Number(value);
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong while talking to the API.";
}

export function AdminProductEditorPage({ productId }: AdminProductEditorPageProps) {
  const isEditing = Boolean(productId);
  const { isAuthenticated, isLoading, token, user } = useAuth();

  const categoriesQuery = useQuery({
    queryKey: ["catalog-categories"],
    queryFn: fetchCatalogCategories,
    enabled: !isLoading,
  });

  const productQuery = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => fetchAdminProduct(token ?? "", productId ?? ""),
    enabled: Boolean(token && user?.role === "admin" && productId),
  });

  if (isLoading || (isEditing && productQuery.isLoading)) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Loading product editor
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              Pulling the product, category options, and current inventory details.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || user?.role !== "admin" || !token) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Admin access required
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              This editor is reserved for admin users because it can change product visibility and inventory counts.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
              >
                Login
              </Link>
              <Link
                href="/admin/products"
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
              >
                Back to admin
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isEditing && productQuery.isError) {
    return (
      <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="glass-panel mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center rounded-[40px] px-6 py-20 text-center">
          <div className="max-w-xl">
            <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight">
              Product could not be loaded
            </p>
            <p className="mt-4 text-base leading-7" style={{ color: "var(--muted)" }}>
              The selected product ID was not found or the admin token could not access it.
            </p>
            <Link
              href="/admin/products"
              className="mt-6 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to admin products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const categories = categoriesQuery.data ?? [];
  const editorKey = `${productId ?? "new"}:${categories[0]?.id ?? "uncategorized"}`;

  return (
    <AdminProductEditorForm
      key={editorKey}
      token={token}
      productId={productId}
      initialProduct={productQuery.data}
      categories={categories}
    />
  );
}

type AdminProductEditorFormProps = {
  token: string;
  productId?: string;
  initialProduct?: AdminProductResponse;
  categories: Awaited<ReturnType<typeof fetchCatalogCategories>>;
};

function AdminProductEditorForm({
  token,
  productId,
  initialProduct,
  categories,
}: AdminProductEditorFormProps) {
  const isEditing = Boolean(productId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentProduct, setCurrentProduct] = useState<AdminProductResponse | undefined>(initialProduct);
  const [form, setForm] = useState<ProductFormState>(() => {
    const seededState = initialProduct ? mapProductToForm(initialProduct) : createInitialState();
    if (!initialProduct && !seededState.category_id && categories[0]?.id) {
      return { ...seededState, category_id: categories[0].id };
    }
    return seededState;
  });
  const [slugEdited, setSlugEdited] = useState(Boolean(initialProduct));
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [adjustmentFeedback, setAdjustmentFeedback] = useState<string | null>(null);
  const [adjustmentDrafts, setAdjustmentDrafts] = useState<AdjustmentDraftState>({});

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminProductUpsertInput) =>
      isEditing && productId
        ? updateAdminProduct(token, productId, payload)
        : createAdminProduct(token, payload),
    onSuccess: (product) => {
      setSaveFeedback(isEditing ? "Product updated successfully." : "Product created successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-product", product.slug] });
      if (productId) {
        queryClient.setQueryData(["admin-product", productId], product);
      }
      setCurrentProduct(product);
      setForm(mapProductToForm(product));
      setSlugEdited(true);
      setAdjustmentFeedback(null);
      if (!isEditing) {
        router.push(`/admin/products/${product.id}`);
      }
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: async (payload: InventoryAdjustmentInput) => adjustAdminInventory(token, payload),
    onSuccess: async (_, variables) => {
      setAdjustmentFeedback("Inventory adjusted successfully.");
      const activeProductId = productId;
      if (!activeProductId) {
        return;
      }
      setAdjustmentDrafts((current) => ({
        ...current,
        [variables.variant_id]: { quantity_delta: "", reason: "" },
      }));
      const product = await fetchAdminProduct(token, activeProductId);
      setCurrentProduct(product);
      setForm(mapProductToForm(product));
      queryClient.setQueryData(["admin-product", activeProductId], product);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-product", product.slug] });
    },
  });

  const productMetadata = currentProduct
    ? {
        createdAt: formatDateTime(currentProduct.created_at),
        updatedAt: formatDateTime(currentProduct.updated_at),
      }
    : null;

  function updateForm<K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateImage(index: number, field: keyof EditableImage, value: EditableImage[keyof EditableImage]) {
    setForm((current) => {
      const nextImages = current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [field]: value } : image,
      );
      if (field === "is_primary" && value === true) {
        return {
          ...current,
          images: nextImages.map((image, imageIndex) => ({
            ...image,
            is_primary: imageIndex === index,
          })),
        };
      }
      return { ...current, images: nextImages };
    });
  }

  function addImage() {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          ...createEmptyImage(),
          is_primary: current.images.length === 0,
          sort_order: current.images.length,
        },
      ],
    }));
  }

  function removeImage(index: number) {
    setForm((current) => {
      const remainingImages = current.images.filter((_, imageIndex) => imageIndex !== index);
      if (remainingImages.length === 0) {
        return { ...current, images: [createEmptyImage()] };
      }
      if (!remainingImages.some((image) => image.is_primary)) {
        remainingImages[0] = { ...remainingImages[0], is_primary: true };
      }
      return { ...current, images: remainingImages };
    });
  }

  function updateVariant(index: number, field: keyof EditableVariant, value: EditableVariant[keyof EditableVariant]) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    }));
  }

  function addVariant() {
    setForm((current) => ({
      ...current,
      variants: [...current.variants, createEmptyVariant()],
    }));
  }

  function removeVariant(index: number) {
    setForm((current) => ({
      ...current,
      variants:
        current.variants.length === 1 ? current.variants : current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveFeedback(null);
    setAdjustmentFeedback(null);

    try {
      const images = form.images
        .filter((image) => image.url.trim())
        .map<AdminProductImageInput>((image, index) => ({
          url: image.url.trim(),
          alt_text: image.alt_text?.trim() || undefined,
          sort_order: image.sort_order ?? index,
          is_primary: image.is_primary,
        }));

      const variants = form.variants.map<AdminProductVariantInput>((variant) => {
        let attributes: Record<string, unknown> = {};
        if (variant.attributesText.trim()) {
          const parsed = JSON.parse(variant.attributesText) as unknown;
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error(`Variant "${variant.name || variant.sku || "new"}" attributes must be a JSON object.`);
          }
          attributes = parsed as Record<string, unknown>;
        }

        return {
          id: variant.id,
          sku: variant.sku.trim(),
          name: variant.name.trim(),
          attributes,
          price: parseOptionalNumber(variant.price),
          weight_grams: parseOptionalNumber(variant.weight_grams),
          status: variant.status,
          stock_on_hand: Number(variant.stock_on_hand),
          stock_reserved: Number(variant.stock_reserved),
          low_stock_threshold: Number(variant.low_stock_threshold),
          allow_backorder: variant.allow_backorder,
        };
      });

      const payload: AdminProductUpsertInput = {
        category_id: form.category_id || categories[0]?.id || "",
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        short_description: form.short_description.trim() || undefined,
        status: form.status,
        brand: form.brand.trim() || undefined,
        base_price: Number(form.base_price),
        compare_at_price: parseOptionalNumber(form.compare_at_price),
        currency: form.currency.trim().toUpperCase(),
        seo_title: form.seo_title.trim() || undefined,
        seo_description: form.seo_description.trim() || undefined,
        images,
        variants,
      };

      await saveMutation.mutateAsync(payload);
    } catch (error) {
      setSaveFeedback(toErrorMessage(error));
    }
  }

  async function handleInventoryAdjust(variantId: string) {
    setAdjustmentFeedback(null);
    const draft = adjustmentDrafts[variantId];
    const delta = Number(draft?.quantity_delta ?? "");
    if (!Number.isFinite(delta) || delta === 0) {
      setAdjustmentFeedback("Enter a non-zero inventory delta before applying an adjustment.");
      return;
    }

    try {
      await adjustmentMutation.mutateAsync({
        variant_id: variantId,
        quantity_delta: delta,
        reason: draft?.reason.trim() || undefined,
      });
    } catch (error) {
      setAdjustmentFeedback(toErrorMessage(error));
    }
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin/products" className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            ← Back to admin products
          </Link>
          {currentProduct ? (
            <Link href={`/products/${currentProduct.slug}`} className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
              View storefront page
            </Link>
          ) : null}
        </div>

        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex rounded-full bg-[var(--brass-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brass)]">
                {isEditing ? "Edit product" : "Create product"}
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                {isEditing ? "Keep the catalog clean and stock-aware." : "Add the next product to the catalog."}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                Products can be draft or active, variants carry SKU-level inventory, and every save updates the
                protected admin catalog.
              </p>
            </div>

            {productMetadata ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <article className="rounded-[28px] border border-[var(--line)] bg-white/65 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                    Created
                  </p>
                  <p className="mt-3 text-sm leading-6">{productMetadata.createdAt}</p>
                </article>
                <article className="rounded-[28px] border border-[var(--line)] bg-white/65 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                    Last updated
                  </p>
                  <p className="mt-3 text-sm leading-6">{productMetadata.updatedAt}</p>
                </article>
              </div>
            ) : null}
          </div>
        </section>

        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-6">
          <section className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Category
                </span>
                <select
                  value={form.category_id}
                  onChange={(event) => updateForm("category_id", event.target.value)}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value as ProductFormState["status"])}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Product name
                </span>
                <input
                  value={form.name}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name: nextName,
                      slug: slugEdited ? current.slug : slugify(nextName),
                    }));
                  }}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Slug
                </span>
                <input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    updateForm("slug", slugify(event.target.value));
                  }}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Base price
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.base_price}
                  onChange={(event) => updateForm("base_price", event.target.value)}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Compare-at price
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compare_at_price}
                  onChange={(event) => updateForm("compare_at_price", event.target.value)}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Currency
                </span>
                <input
                  value={form.currency}
                  onChange={(event) => updateForm("currency", event.target.value.toUpperCase())}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm uppercase outline-none transition focus:border-[var(--teal)]"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Brand
                </span>
                <input
                  value={form.brand}
                  onChange={(event) => updateForm("brand", event.target.value)}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Short description
                </span>
                <input
                  value={form.short_description}
                  onChange={(event) => updateForm("short_description", event.target.value)}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  rows={5}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  SEO title
                </span>
                <input
                  value={form.seo_title}
                  onChange={(event) => updateForm("seo_title", event.target.value)}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                  SEO description
                </span>
                <input
                  value={form.seo_description}
                  onChange={(event) => updateForm("seo_description", event.target.value)}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                />
              </label>
            </div>
          </section>

          <section className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  Product images
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Use local public assets or full URLs. One image should be marked as primary.
                </p>
              </div>
              <button
                type="button"
                onClick={addImage}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
              >
                Add image
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {form.images.map((image, index) => (
                <div key={image.key} className="rounded-[26px] border border-[var(--line)] bg-white/65 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_0.6fr_0.4fr_auto] lg:items-end">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Image URL
                      </span>
                      <input
                        value={image.url}
                        onChange={(event) => updateImage(index, "url", event.target.value)}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Alt text
                      </span>
                      <input
                        value={image.alt_text ?? ""}
                        onChange={(event) => updateImage(index, "alt_text", event.target.value)}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Sort
                      </span>
                      <input
                        type="number"
                        value={image.sort_order}
                        onChange={(event) => updateImage(index, "sort_order", Number(event.target.value))}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={image.is_primary}
                        onChange={(event) => updateImage(index, "is_primary", event.target.checked)}
                      />
                      Primary
                    </label>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  Variants and inventory
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Each variant carries its own SKU, optional price override, and live stock values.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
              >
                Add variant
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {form.variants.map((variant, index) => (
                <div key={variant.key} className="rounded-[26px] border border-[var(--line)] bg-white/65 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight">
                      Variant {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        SKU
                      </span>
                      <input
                        value={variant.sku}
                        onChange={(event) => updateVariant(index, "sku", event.target.value)}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Name
                      </span>
                      <input
                        value={variant.name}
                        onChange={(event) => updateVariant(index, "name", event.target.value)}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Price override
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(event) => updateVariant(index, "price", event.target.value)}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Status
                      </span>
                      <select
                        value={variant.status}
                        onChange={(event) => updateVariant(index, "status", event.target.value as EditableVariant["status"])}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Stock on hand
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock_on_hand}
                        onChange={(event) => updateVariant(index, "stock_on_hand", Number(event.target.value))}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Reserved
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock_reserved}
                        onChange={(event) => updateVariant(index, "stock_reserved", Number(event.target.value))}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Low stock threshold
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={variant.low_stock_threshold}
                        onChange={(event) => updateVariant(index, "low_stock_threshold", Number(event.target.value))}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Weight grams
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={variant.weight_grams}
                        onChange={(event) => updateVariant(index, "weight_grams", event.target.value)}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Attributes JSON
                      </span>
                      <textarea
                        value={variant.attributesText}
                        onChange={(event) => updateVariant(index, "attributesText", event.target.value)}
                        rows={4}
                        className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 font-mono text-sm outline-none transition focus:border-[var(--teal)]"
                      />
                    </label>
                    <label className="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm">
                      <input
                        type="checkbox"
                        checked={variant.allow_backorder}
                        onChange={(event) => updateVariant(index, "allow_backorder", event.target.checked)}
                      />
                      Allow backorder
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {saveFeedback ? (
            <section className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-4 text-sm">
              {saveFeedback}
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveMutation.isPending ? "Saving..." : isEditing ? "Save changes" : "Create product"}
            </button>
            <Link
              href="/admin/products"
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
            >
              Cancel
            </Link>
          </div>
        </form>

        {currentProduct ? (
          <section className="glass-panel rounded-[32px] p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Inventory adjustments
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Use the dedicated inventory movement endpoint for operational stock corrections instead of editing history
              directly in the product payload.
            </p>

            {adjustmentFeedback ? (
              <div className="mt-4 rounded-[20px] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm">
                {adjustmentFeedback}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              {currentProduct.variants.map((variant) => {
                const draft = adjustmentDrafts[variant.id] ?? { quantity_delta: "", reason: "" };
                return (
                  <div key={variant.id} className="rounded-[26px] border border-[var(--line)] bg-white/65 p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr] xl:items-end">
                      <div>
                        <p className="font-semibold">{variant.name}</p>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                          SKU {variant.sku} • effective price {formatCurrency(variant.effective_price, currentProduct.currency)}
                        </p>
                        <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                          <p><strong>On hand:</strong> {variant.inventory.stock_on_hand}</p>
                          <p><strong>Reserved:</strong> {variant.inventory.stock_reserved}</p>
                          <p><strong>Available:</strong> {variant.inventory.available_stock}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[0.6fr_1fr_auto]">
                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                            Delta
                          </span>
                          <input
                            type="number"
                            value={draft.quantity_delta}
                            onChange={(event) =>
                              setAdjustmentDrafts((current) => ({
                                ...current,
                                [variant.id]: {
                                  quantity_delta: event.target.value,
                                  reason: current[variant.id]?.reason ?? "",
                                },
                              }))
                            }
                            className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                          />
                        </label>
                        <label className="grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                            Reason
                          </span>
                          <input
                            value={draft.reason}
                            onChange={(event) =>
                              setAdjustmentDrafts((current) => ({
                                ...current,
                                [variant.id]: {
                                  quantity_delta: current[variant.id]?.quantity_delta ?? "",
                                  reason: event.target.value,
                                },
                              }))
                            }
                            className="rounded-[18px] border border-[var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void handleInventoryAdjust(variant.id)}
                          disabled={adjustmentMutation.isPending}
                          className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
