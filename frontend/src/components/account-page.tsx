"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { useAuth } from "@/app/providers";
import {
  createAccountAddress,
  deleteAccountAddress,
  fetchAccountAddresses,
  fetchAccountOrderDetail,
  fetchAccountOrders,
  fetchAccountProfile,
  CustomerAddressInput,
  updateAccountAddress,
} from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/format";

type AddressFormState = {
  type: "shipping" | "billing" | "both";
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

const EMPTY_ADDRESS_FORM: AddressFormState = {
  type: "shipping",
  recipient_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "BR",
  is_default: false,
};

function toAddressPayload(form: AddressFormState): CustomerAddressInput {
  return {
    type: form.type,
    recipient_name: form.recipient_name,
    phone: form.phone || undefined,
    line1: form.line1,
    line2: form.line2 || undefined,
    city: form.city,
    region: form.region,
    postal_code: form.postal_code,
    country: form.country,
    is_default: form.is_default,
  };
}

export function AccountPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["account-profile", token],
    queryFn: () => fetchAccountProfile(token ?? ""),
    enabled: Boolean(token),
  });
  const addressesQuery = useQuery({
    queryKey: ["account-addresses", token],
    queryFn: () => fetchAccountAddresses(token ?? ""),
    enabled: Boolean(token),
  });
  const ordersQuery = useQuery({
    queryKey: ["account-orders", token],
    queryFn: () => fetchAccountOrders(token ?? "", { limit: 20, offset: 0 }),
    enabled: Boolean(token),
  });
  const selectedOrderQuery = useQuery({
    queryKey: ["account-order-detail", selectedOrderId, token],
    queryFn: () => fetchAccountOrderDetail(token ?? "", selectedOrderId ?? ""),
    enabled: Boolean(token && selectedOrderId),
  });
  const addressMutation = useMutation({
    mutationFn: async (payload: CustomerAddressInput) => {
      if (!token) {
        throw new Error("Authentication required.");
      }
      if (editingAddressId) {
        return updateAccountAddress(token, editingAddressId, payload);
      }
      return createAccountAddress(token, payload);
    },
    onSuccess: async () => {
      setAddressForm(EMPTY_ADDRESS_FORM);
      setEditingAddressId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["account-addresses"] }),
      ]);
    },
  });
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      if (!token) {
        throw new Error("Authentication required.");
      }
      await deleteAccountAddress(token, addressId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["account-addresses"] }),
      ]);
    },
  });

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

  const profile = profileQuery.data;
  const addresses = addressesQuery.data ?? [];
  const orders = ordersQuery.data?.items ?? [];
  const selectedOrder = selectedOrderQuery.data;
  const customer = user.customer;
  const addressError =
    (addressMutation.error instanceof Error && addressMutation.error.message) ||
    (deleteAddressMutation.error instanceof Error && deleteAddressMutation.error.message) ||
    null;
  const isAccountLoading = profileQuery.isLoading || addressesQuery.isLoading || ordersQuery.isLoading;
  const heroName = profile?.first_name ?? customer?.first_name ?? null;
  const selectedOrderSummary = orders.find((order) => order.id === selectedOrderId) ?? null;

  function startEditingAddress(address: (typeof addresses)[number]) {
    setEditingAddressId(address.id);
    setAddressForm({
      type: address.type as "shipping" | "billing" | "both",
      recipient_name: address.recipient_name,
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      region: address.region,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
  }

  function resetAddressForm() {
    setEditingAddressId(null);
    setAddressForm(EMPTY_ADDRESS_FORM);
  }

  function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addressMutation.mutate(toAddressPayload(addressForm));
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="glass-panel rounded-[40px] p-6 sm:p-8">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--teal)]">
            Stage 6 account area
          </div>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Welcome back{heroName ? `, ${heroName}` : ""}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
            The customer account now pulls profile context, saved addresses, and owned orders from protected commerce
            APIs without exposing another customer&apos;s data.
          </p>
        </section>

        {isAccountLoading ? (
          <section className="glass-panel rounded-[32px] p-6">
            <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Loading account workspace
            </p>
            <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Pulling customer profile, saved addresses, and recent orders.
            </p>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Account overview
            </h2>
            <div className="mt-5 grid gap-3 text-sm">
              <p><strong>Email:</strong> {profile?.email ?? user.email}</p>
              <p><strong>Role:</strong> {profile?.role ?? user.role}</p>
              <p><strong>Active:</strong> {user.is_active ? "yes" : "no"}</p>
              <p><strong>Last login:</strong> {formatDateTime(profile?.last_login_at ?? user.last_login_at)}</p>
              <p><strong>Addresses:</strong> {profile?.address_count ?? 0}</p>
              <p><strong>Orders:</strong> {profile?.order_count ?? 0}</p>
            </div>
          </article>

          <article className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Customer profile
            </h2>
            <div className="mt-5 grid gap-3 text-sm">
              <p><strong>First name:</strong> {profile?.first_name ?? customer?.first_name ?? "Not set yet"}</p>
              <p><strong>Last name:</strong> {profile?.last_name ?? customer?.last_name ?? "Not set yet"}</p>
              <p><strong>Phone:</strong> {profile?.phone ?? customer?.phone ?? "Not set yet"}</p>
              <p><strong>Marketing opt-in:</strong> {(profile?.marketing_opt_in ?? customer?.marketing_opt_in) ? "yes" : "no"}</p>
              <p><strong>Account created:</strong> {formatDateTime(profile?.created_at ?? user.created_at)}</p>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="glass-panel rounded-[32px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                  Saved addresses
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  Add, edit, and remove checkout-ready customer addresses.
                </p>
              </div>
              {editingAddressId ? (
                <button
                  type="button"
                  onClick={resetAddressForm}
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4">
              {addresses.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm" style={{ color: "var(--muted)" }}>
                  No saved addresses yet.
                </div>
              ) : (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{address.recipient_name}</p>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                          {address.type} {address.is_default ? "• default" : ""}
                        </p>
                        <p className="mt-2 text-sm">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                        </p>
                        <p className="text-sm">
                          {address.city}, {address.region} {address.postal_code}
                        </p>
                        <p className="text-sm">{address.country}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingAddress(address)}
                          className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAddressMutation.mutate(address.id)}
                          disabled={deleteAddressMutation.isPending}
                          className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              {editingAddressId ? "Edit address" : "Add address"}
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Address records live on the customer profile and are protected by ownership checks.
            </p>

            {addressError ? (
              <p className="mt-5 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {addressError}
              </p>
            ) : null}

            <form onSubmit={handleAddressSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Type</span>
                <select
                  value={addressForm.type}
                  onChange={(event) => setAddressForm((current) => ({ ...current, type: event.target.value as AddressFormState["type"] }))}
                  className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]"
                >
                  <option value="shipping">shipping</option>
                  <option value="billing">billing</option>
                  <option value="both">both</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Recipient</span>
                <input value={addressForm.recipient_name} onChange={(event) => setAddressForm((current) => ({ ...current, recipient_name: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Phone</span>
                <input value={addressForm.phone} onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Line 1</span>
                <input value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Line 2</span>
                <input value={addressForm.line2} onChange={(event) => setAddressForm((current) => ({ ...current, line2: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>City</span>
                <input value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Region</span>
                <input value={addressForm.region} onChange={(event) => setAddressForm((current) => ({ ...current, region: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Postal code</span>
                <input value={addressForm.postal_code} onChange={(event) => setAddressForm((current) => ({ ...current, postal_code: event.target.value }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Country</span>
                <input value={addressForm.country} onChange={(event) => setAddressForm((current) => ({ ...current, country: event.target.value.toUpperCase() }))} className="rounded-[20px] border border-[var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-[var(--teal)]" required maxLength={2} />
              </label>
              <label className="md:col-span-2 flex items-center gap-3 rounded-[20px] border border-[var(--line)] bg-white/60 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(event) => setAddressForm((current) => ({ ...current, is_default: event.target.checked }))}
                />
                Make this the default address
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={addressMutation.isPending}
                  className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addressMutation.isPending ? "Saving..." : editingAddressId ? "Update address" : "Add address"}
                </button>
                <button
                  type="button"
                  onClick={resetAddressForm}
                  className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold"
                >
                  Reset
                </button>
              </div>
            </form>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <article className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Order history
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Only orders owned by this customer are returned by the account API.
            </p>

            <div className="mt-6 grid gap-4">
              {orders.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm" style={{ color: "var(--muted)" }}>
                  No account orders yet. Place a checkout order to populate this history.
                </div>
              ) : (
                orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`rounded-[24px] border p-4 text-left transition ${selectedOrderId === order.id ? "border-[var(--teal)] bg-[var(--teal-soft)]" : "border-[var(--line)] bg-white/70"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{order.order_number}</p>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                          {formatDateTime(order.created_at)} • {order.item_count} item{order.item_count === 1 ? "" : "s"}
                        </p>
                        <p className="mt-2 text-sm">
                          Status: {order.status}
                          {order.payment_status ? ` • payment ${order.payment_status}` : ""}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(order.total_amount, order.currency)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Order detail
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              Select an order from the history to inspect the full snapshot, including payment state.
            </p>

            {!selectedOrderId ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm" style={{ color: "var(--muted)" }}>
                Pick an order to load its detail view.
              </div>
            ) : selectedOrderQuery.isLoading ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[var(--line)] bg-white/60 p-5 text-sm" style={{ color: "var(--muted)" }}>
                Loading order detail for {selectedOrderSummary?.order_number ?? "the selected order"}.
              </div>
            ) : selectedOrderQuery.isError || !selectedOrder ? (
              <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                The order detail could not be loaded for this account.
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4 text-sm">
                  <p><strong>Order number:</strong> {selectedOrder.order_number}</p>
                  <p><strong>Status:</strong> {selectedOrder.status}</p>
                  <p><strong>Payment:</strong> {selectedOrder.payment?.status ?? "not created"}</p>
                  <p><strong>Email:</strong> {selectedOrder.email}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</p>
                </div>

                <div className="grid gap-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link href={`/products/${item.product_slug}`} className="font-semibold">
                            {item.product_name}
                          </Link>
                          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                            {item.variant_name} • SKU {item.sku} • qty {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.line_total, selectedOrder.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
