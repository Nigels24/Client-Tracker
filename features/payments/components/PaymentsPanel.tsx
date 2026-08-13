"use client";

import { format } from "date-fns";
import { Trash2, Wallet } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import AddPaymentForm from "@/features/payments/components/AddPaymentForm";
import { useDeletePayment } from "@/features/payments/hooks/use-payments";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  balance,
  formatPeso,
  paidProgress,
  paymentStatus,
  totalPaid,
  totalPrice,
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

export default function PaymentsPanel({ client }: { client: Client }) {
  const deletePayment = useDeletePayment(client.id);

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
                <p className="font-medium text-foreground">
                  {formatPeso(payment.amount)}
                  {payment.label && (
                    <span className="ml-2 text-sm font-normal text-muted">
                      {payment.label}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {format(new Date(payment.paidAt), "MMM d, yyyy")}
                  {payment.method && ` · ${payment.method}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(payment.id, payment.amount)}
                aria-label="Delete payment"
                className="rounded-full p-1.5 text-overdue-text hover:bg-overdue-bg cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
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
        isFirstPayment={client.payments.length === 0}
      />
    </div>
  );
}
