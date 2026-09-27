"use client";

import { format } from "date-fns";
import { Trash2, Wallet } from "lucide-react";
import type { PAYMENT_FOR } from "@prisma/client";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import AddPaymentForm from "@/features/payments/components/AddPaymentForm";
import {
  useDeletePayment,
  useUpdatePayment,
} from "@/features/payments/hooks/use-payments";
import {
  PAYMENT_FOR_LABELS,
  PAYMENT_FOR_OPTIONS,
  PAYMENT_FOR_STYLES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  balance,
  formatPeso,
  paidFor,
  paidProgress,
  partBalance,
  partPrice,
  partProgress,
  paymentStatus,
  totalPaid,
  totalPrice,
  unassignedPaid,
} from "@/lib/money";
import type { Client } from "@/features/clients/types";

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-lg font-semibold ${emphasis ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

const PARTS: PAYMENT_FOR[] = ["SYSTEM", "DOCU"];

const ASSIGN_OPTIONS = [
  ...PAYMENT_FOR_OPTIONS,
  { value: "", label: "Unassigned" },
];

/** One line of the System / Docu breakdown shown under the combined totals. */
function PartRow({ client, part }: { client: Client; part: PAYMENT_FOR }) {
  const price = partPrice(client, part);
  const paid = paidFor(client, part);
  const remaining = partBalance(client, part);

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[5rem_1fr_1fr_1fr] items-center gap-2 text-sm">
        <span>
          <Badge label={PAYMENT_FOR_LABELS[part]} className={PAYMENT_FOR_STYLES[part]} />
        </span>
        <span className="text-muted">
          {price > 0 ? formatPeso(price) : "No price"}
        </span>
        <span className="text-foreground">{formatPeso(paid)} paid</span>
        <span
          className={`text-right font-medium ${
            remaining > 0 ? "text-overdue-text" : "text-pay-paid-text"
          }`}
        >
          {remaining < 0
            ? `Overpaid by ${formatPeso(-remaining)}`
            : `${formatPeso(remaining)} left`}
        </span>
      </div>
      {price > 0 && <ProgressBar value={partProgress(client, part)} />}
    </div>
  );
}

export default function PaymentsPanel({ client }: { client: Client }) {
  const deletePayment = useDeletePayment(client.id);
  const updatePayment = useUpdatePayment(client.id);
  const isBoth = client.projectType === "BOTH";
  const unassigned = unassignedPaid(client);

  const price = totalPrice(client);
  const paid = totalPaid(client);
  const remaining = balance(client);
  const status = paymentStatus(client);

  const handleDelete = async (id: number, amount: number) => {
    if (!window.confirm(`Delete the ${formatPeso(amount)} payment?`)) return;
    await deletePayment.mutateAsync(id);
  };

  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Payments
        </h2>
        {status && (
          <Badge
            label={PAYMENT_STATUS_LABELS[status]}
            className={PAYMENT_STATUS_STYLES[status]}
          />
        )}
      </div>

      {price > 0 ? (
        <div className="mb-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total price" value={formatPeso(price)} />
            <Stat label="Paid" value={formatPeso(paid)} />
            <Stat
              label={remaining < 0 ? "Overpaid by" : "Balance"}
              value={formatPeso(Math.abs(remaining))}
              emphasis={remaining > 0 ? "text-overdue-text" : "text-pay-paid-text"}
            />
          </div>
          <ProgressBar value={paidProgress(client)} />

          {isBoth && (
            <div className="space-y-3 border-t border-card-border pt-3">
              {PARTS.map((part) => (
                <PartRow key={part} client={client} part={part} />
              ))}
              {unassigned > 0 && (
                <p className="text-xs text-muted">
                  {formatPeso(unassigned)} in payments not yet assigned to System or
                  Docu.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="mb-5 text-sm text-muted">
          No price set yet — add one with <span className="font-medium">Edit</span> to
          track the balance. You can still record payments below.
        </p>
      )}

      {client.payments.length > 0 ? (
        <div className="mb-4 space-y-2">
          {client.payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-card-border p-3"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium text-foreground">
                  {formatPeso(payment.amount)}
                  {payment.appliesTo ? (
                    <Badge
                      label={PAYMENT_FOR_LABELS[payment.appliesTo]}
                      className={PAYMENT_FOR_STYLES[payment.appliesTo]}
                    />
                  ) : (
                    <Badge
                      label="Unassigned"
                      className="border border-card-border text-muted"
                    />
                  )}
                  {payment.label && (
                    <span className="text-sm font-normal text-muted">
                      {payment.label}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {format(new Date(payment.paidAt), "MMM d, yyyy")}
                  {payment.method && ` · ${payment.method}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isBoth && (
                  <select
                    aria-label="Payment applies to"
                    value={payment.appliesTo ?? ""}
                    disabled={updatePayment.isPending}
                    onChange={(event) =>
                      updatePayment.mutate({
                        id: payment.id,
                        input: {
                          appliesTo: (event.target.value || null) as PAYMENT_FOR | null,
                        },
                      })
                    }
                    className="rounded-md border border-card-border bg-white px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand/[0.2] cursor-pointer disabled:cursor-default disabled:text-muted"
                  >
                    {ASSIGN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(payment.id, payment.amount)}
                  aria-label="Delete payment"
                  className="rounded-full p-1.5 text-overdue-text hover:bg-overdue-bg cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <EmptyState
            icon={Wallet}
            title="No payments yet"
            description="Record the downpayment below once they've paid."
          />
        </div>
      )}

      <AddPaymentForm
        clientId={client.id}
        projectType={client.projectType}
        isFirstPayment={client.payments.length === 0}
      />
    </div>
  );
}
