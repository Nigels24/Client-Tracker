"use client";

import { formatPeso, paymentStatus, totalPaid, totalPrice } from "@/lib/money";
import type { Client } from "@/features/clients/types";

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

/**
 * Computed in the browser from the clients already in the cache — the numbers
 * reflect whatever filter is currently applied, so they always match the cards
 * shown beneath them.
 */
export default function MoneySummary({ clients }: { clients: Client[] }) {
  const priced = clients.filter((client) => totalPrice(client) > 0);
  if (priced.length === 0) return null;

  const value = priced.reduce((sum, client) => sum + totalPrice(client), 0);
  const collected = priced.reduce((sum, client) => sum + totalPaid(client), 0);
  const outstanding = Math.max(0, value - collected);
  const fullyPaid = priced.filter((client) => paymentStatus(client) === "PAID").length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="Total value" value={formatPeso(value)} />
      <Tile label="Collected" value={formatPeso(collected)} tone="text-pay-paid-text" />
      <Tile
        label="Still owed"
        value={formatPeso(outstanding)}
        tone={outstanding > 0 ? "text-overdue-text" : undefined}
      />
      <Tile label="Fully paid" value={`${fullyPaid} of ${priced.length}`} />
    </div>
  );
}
