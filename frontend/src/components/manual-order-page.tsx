"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { createOrder, CreateOrderInput } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const INITIAL_FORM = {
  sourceRecordId: "",
  orderDate: new Date().toISOString().slice(0, 10),
  customerId: "cust-manual-001",
  productId: "prod-manual-001",
  productName: "",
  category: "electronics",
  region: "southeast",
  channel: "online",
  quantity: "1",
  unitPrice: "100.00",
  totalAmount: "",
};

type ManualOrderFormState = typeof INITIAL_FORM;

function toPayload(form: ManualOrderFormState): CreateOrderInput {
  return {
    source_record_id: form.sourceRecordId || undefined,
    order_date: form.orderDate,
    customer_id: form.customerId,
    product_id: form.productId,
    product_name: form.productName,
    category: form.category,
    region: form.region,
    channel: form.channel,
    quantity: Number(form.quantity),
    unit_price: Number(form.unitPrice),
    total_amount: form.totalAmount ? Number(form.totalAmount) : undefined,
  };
}

function Field({
  label,
  children,
  helpText,
}: {
  label: string;
  children: React.ReactNode;
  helpText?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      {children}
      {helpText ? (
        <span className="text-xs leading-5" style={{ color: "var(--muted)" }}>
          {helpText}
        </span>
      ) : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[var(--teal)]"
    />
  );
}

export function ManualOrderPage() {
  const [form, setForm] = useState<ManualOrderFormState>(INITIAL_FORM);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateOrderInput) => createOrder(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["summary-metrics"] }),
        queryClient.invalidateQueries({ queryKey: ["revenue-over-time"] }),
        queryClient.invalidateQueries({ queryKey: ["top-products"] }),
        queryClient.invalidateQueries({ queryKey: ["revenue-by-region"] }),
        queryClient.invalidateQueries({ queryKey: ["revenue-by-channel"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["latest-ingestion-run"] }),
        queryClient.invalidateQueries({ queryKey: ["orders-catalog"] }),
      ]);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(toPayload(form));
  }

  return (
    <main className="bg-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="glass-panel overflow-hidden rounded-[40px] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-[var(--brass-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brass)]">
                Manual test flow
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight sm:text-5xl">
                Add a new order and push it through the same pipeline.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--muted)" }}>
                This page lets reviewers create a single test order, run ingestion plus transformation, and then go
                back to the dashboard to confirm the metrics changed.
              </p>
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--muted)" }}>
                Useful pattern
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--foreground)" }}>
                Leave <strong>source record ID</strong> blank to let the backend generate a safe test identifier.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className="glass-panel rounded-[32px] p-6">
            <div className="mb-6">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
                Test order form
              </h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Required text fields are trimmed on the backend. If you leave total amount blank, the system will
                calculate it from quantity and unit price during transformation.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Source record ID" helpText="Optional. Blank values trigger backend generation.">
                <TextInput
                  value={form.sourceRecordId}
                  onChange={(event) => setForm((current) => ({ ...current, sourceRecordId: event.target.value }))}
                  placeholder="manual-order-001"
                />
              </Field>

              <Field label="Order date">
                <TextInput
                  type="date"
                  value={form.orderDate}
                  onChange={(event) => setForm((current) => ({ ...current, orderDate: event.target.value }))}
                  required
                />
              </Field>

              <Field label="Customer ID">
                <TextInput
                  value={form.customerId}
                  onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}
                  required
                />
              </Field>

              <Field label="Product ID">
                <TextInput
                  value={form.productId}
                  onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
                  required
                />
              </Field>

              <Field label="Product name">
                <TextInput
                  value={form.productName}
                  onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
                  placeholder="Portable Projector"
                  required
                />
              </Field>

              <Field label="Category">
                <TextInput
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  required
                />
              </Field>

              <Field label="Region">
                <SelectInput
                  value={form.region}
                  onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                >
                  <option value="southeast">southeast</option>
                  <option value="south">south</option>
                  <option value="northeast">northeast</option>
                  <option value="north">north</option>
                  <option value="midwest">midwest</option>
                </SelectInput>
              </Field>

              <Field label="Channel">
                <SelectInput
                  value={form.channel}
                  onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}
                >
                  <option value="online">online</option>
                  <option value="marketplace">marketplace</option>
                  <option value="partner">partner</option>
                  <option value="physical_store">physical_store</option>
                  <option value="phone_sales">phone_sales</option>
                </SelectInput>
              </Field>

              <Field label="Quantity">
                <TextInput
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                  required
                />
              </Field>

              <Field label="Unit price">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))}
                  required
                />
              </Field>

              <Field label="Total amount" helpText="Optional. Leave blank to let the pipeline calculate it.">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(event) => setForm((current) => ({ ...current, totalAmount: event.target.value }))}
                  placeholder="Auto-calculate"
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? "Submitting order..." : "Submit test order"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(INITIAL_FORM);
                  mutation.reset();
                }}
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/50"
              >
                Reset form
              </button>
            </div>
          </form>

          <section className="glass-panel rounded-[32px] p-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight">
              Submission result
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
              The latest API response appears here, including generated IDs and any quality issues that blocked
              transformation.
            </p>

            {mutation.error ? (
              <div className="mt-6 rounded-[24px] border border-[#b4534f33] bg-[#fff5f4] p-5">
                <p className="font-semibold text-[var(--rose)]">Submission failed</p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted)" }}>
                  {mutation.error.message}
                </p>
              </div>
            ) : null}

            {mutation.data ? (
              <div className="mt-6 flex flex-col gap-4">
                <div className="rounded-[24px] bg-[var(--surface-strong)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                        Status
                      </p>
                      <p className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-semibold">
                        {mutation.data.status}
                      </p>
                    </div>
                    <div className="rounded-full bg-[var(--teal-soft)] px-4 py-2 text-sm font-semibold text-[var(--teal)]">
                      {mutation.data.source_record_id}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6" style={{ color: "var(--muted)" }}>
                    {mutation.data.message}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard label="Ingestion run" value={mutation.data.ingestion_run_id} />
                  <InfoCard label="Transform run" value={mutation.data.transform_run_id ?? "not started"} />
                </div>

                {mutation.data.created_order ? (
                  <div className="rounded-[24px] border border-[var(--line)] bg-white/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                      Created analytical order
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <InfoCard label="Product" value={mutation.data.created_order.product_name} />
                      <InfoCard label="Revenue" value={formatCurrency(mutation.data.created_order.total_amount)} />
                      <InfoCard label="Region" value={mutation.data.created_order.region} />
                      <InfoCard label="Channel" value={mutation.data.created_order.channel} />
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-[var(--line)] bg-white/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                    Quality summary
                  </p>
                  {mutation.data.quality_summary.issue_types.length > 0 ? (
                    <ul className="mt-4 flex flex-col gap-3">
                      {mutation.data.quality_summary.issue_types.map((issue) => (
                        <li
                          key={issue.issue_type}
                          className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-4 py-3 text-sm"
                        >
                          <span>{issue.issue_type.replaceAll("_", " ")}</span>
                          <span className="font-semibold">{issue.count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] px-4 py-5 text-sm" style={{ color: "var(--muted)" }}>
                      No quality issues were generated for this submission.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="rounded-full border border-[var(--teal)] bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,118,110,0.22)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0c615a]"
                  >
                    Return to dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(INITIAL_FORM);
                      mutation.reset();
                    }}
                    className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/50"
                  >
                    Add another
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6" style={{ color: "var(--muted)" }}>
                Submit a new test order to see generated record IDs, pipeline status, and quality output.
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-medium">{value}</p>
    </div>
  );
}
