import { PROJECT_TYPE } from "@prisma/client";
import { hasDocu, hasSystem } from "@/lib/project-type";

/**
 * Money is stored and handled as WHOLE PESOS (integers) everywhere — DB column,
 * API payload, form input. There are no centavos, so every total is exact and
 * no rounding is ever needed.
 */

export type PAYMENT_STATUS = "UNPAID" | "PARTIAL" | "PAID";

export const PAYMENT_STATUS_LABELS: Record<PAYMENT_STATUS, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

// Outlined rather than solid, so a payment badge never reads as a status chip
// when the two sit side by side on a card.
export const PAYMENT_STATUS_STYLES: Record<PAYMENT_STATUS, string> = {
  UNPAID: "border border-pay-unpaid-text/25 bg-pay-unpaid-bg text-pay-unpaid-text",
  PARTIAL: "border border-pay-partial-text/25 bg-pay-partial-bg text-pay-partial-text",
  PAID: "border border-pay-paid-text/25 bg-pay-paid-bg text-pay-paid-text",
};

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPeso(amount: number | null | undefined) {
  return pesoFormatter.format(amount ?? 0);
}

type PricedClient = {
  projectType: PROJECT_TYPE;
  systemPrice: number | null;
  docuPrice: number | null;
};

type PaidClient = {
  payments: { amount: number }[];
};

/** Only the prices that apply to the client's project type count. */
export function totalPrice(client: PricedClient) {
  const system = hasSystem(client.projectType) ? client.systemPrice ?? 0 : 0;
  const docu = hasDocu(client.projectType) ? client.docuPrice ?? 0 : 0;
  return system + docu;
}

export function totalPaid(client: PaidClient) {
  return client.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/** Negative when the client has overpaid. */
export function balance(client: PricedClient & PaidClient) {
  return totalPrice(client) - totalPaid(client);
}

/**
 * `null` when no price has been set yet — an unpriced client shouldn't be
 * labelled "Unpaid", there's simply nothing to owe.
 */
export function paymentStatus(
  client: PricedClient & PaidClient
): PAYMENT_STATUS | null {
  const price = totalPrice(client);
  if (price <= 0) return null;

  const paid = totalPaid(client);
  if (paid <= 0) return "UNPAID";
  return paid >= price ? "PAID" : "PARTIAL";
}

/** 0-100, for ProgressBar. Returns 0 when there's no price to measure against. */
export function paidProgress(client: PricedClient & PaidClient) {
  const price = totalPrice(client);
  if (price <= 0) return 0;
  return Math.min(100, Math.round((totalPaid(client) / price) * 100));
}
