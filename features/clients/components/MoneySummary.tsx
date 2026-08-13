"use client";

import {
  formatPeso,
  myCollected,
  myIncome,
  myIncomeDocu,
  myIncomeSystem,
  owedFor,
  partnerCut,
  paymentStatus,
  totalPrice,
} from "@/lib/money";
import type { Client } from "@/features/clients/types";

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone ?? "text-foreground"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

const sum = (clients: Client[], of: (client: Client) => number) =>
  clients.reduce((total, client) => total + of(client), 0);

/**
 * Computed in the browser from the clients already in the cache — the numbers
 * reflect whatever filter is currently applied, so they always match the cards
 * shown beneath them.
 *
 * The income tiles are net of any partner's cut; the owed tiles are gross —
 * what clients still have to hand over. The labels spell out which is which.
 */
export default function MoneySummary({ clients }: { clients: Client[] }) {
  const priced = clients.filter((client) => totalPrice(client) > 0);
  if (priced.length === 0) return null;

  const incomeSystem = sum(priced, myIncomeSystem);
  const incomeDocu = sum(priced, myIncomeDocu);
  const incomeTotal = sum(priced, myIncome);
  const collected = sum(priced, myCollected);
  const owedSystem = sum(priced, (client) => owedFor(client, "system"));
  const owedDocu = sum(priced, (client) => owedFor(client, "docu"));

  const contractValue = sum(priced, totalPrice);
  const partnerShare = sum(priced, partnerCut);
  const fullyPaid = priced.filter((client) => paymentStatus(client) === "PAID").length;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile
          label="My income — System"
          value={formatPeso(incomeSystem)}
          hint="after partner share"
        />
        <Tile label="My income — Thesis-Docu" value={formatPeso(incomeDocu)} />
        <Tile
          label="My income — Total"
          value={formatPeso(incomeTotal)}
          tone="text-brand"
        />
        <Tile
          label="Collected (my share)"
          value={formatPeso(collected)}
          tone="text-pay-paid-text"
        />
        <Tile
          label="Still owed — System"
          value={formatPeso(owedSystem)}
          hint="clients still to pay"
          tone={owedSystem > 0 ? "text-overdue-text" : undefined}
        />
        <Tile
          label="Still owed — Docu"
          value={formatPeso(owedDocu)}
          hint="clients still to pay"
          tone={owedDocu > 0 ? "text-overdue-text" : undefined}
        />
      </div>
      <p className="px-1 text-xs text-muted">
        Contract value {formatPeso(contractValue)}
        {partnerShare > 0 && <> · Partner share {formatPeso(partnerShare)}</>} · Fully
        paid {fullyPaid} of {priced.length}
      </p>
    </div>
  );
}
