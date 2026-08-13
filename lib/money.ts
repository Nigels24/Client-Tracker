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

type PartneredClient = PricedClient & {
  partnerName: string | null;
  partnerSharePercent: number;
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

/* ------------------------------------------------------------------ *
 * Partner share
 *
 * Whoever refers a client takes a cut of the SYSTEM price only — docu
 * work is always kept in full.
 * ------------------------------------------------------------------ */

function systemPriceOf(client: PricedClient) {
  return hasSystem(client.projectType) ? client.systemPrice ?? 0 : 0;
}

function docuPriceOf(client: PricedClient) {
  return hasDocu(client.projectType) ? client.docuPrice ?? 0 : 0;
}

/** What the referring partner is owed. No partner name means no cut. */
export function partnerCut(client: PartneredClient) {
  if (!client.partnerName || client.partnerSharePercent <= 0) return 0;
  return Math.round((systemPriceOf(client) * client.partnerSharePercent) / 100);
}

/**
 * Your half of the system price. Derived by subtraction, so your share and the
 * partner's always add back to the system price exactly — never off by a peso.
 */
export function myIncomeSystem(client: PartneredClient) {
  return systemPriceOf(client) - partnerCut(client);
}

/** Docu work is never shared. */
export function myIncomeDocu(client: PricedClient) {
  return docuPriceOf(client);
}

/** Everything this client is worth to you once fully paid. */
export function myIncome(client: PartneredClient) {
  return myIncomeSystem(client) + myIncomeDocu(client);
}

/* ------------------------------------------------------------------ *
 * Splitting money across system vs docu
 *
 * Payments aren't earmarked, so they're split in proportion to the two
 * prices. System is computed by ratio, then docu takes the remainder —
 * that way the two halves always add back to the real figure.
 * ------------------------------------------------------------------ */

export type ProjectPart = "system" | "docu";

export function paidToward(
  client: PricedClient & PaidClient,
  part: ProjectPart
) {
  const price = totalPrice(client);
  if (price <= 0) return 0;

  // Never allocate more than the contract is worth, even after an overpayment.
  const paid = Math.min(totalPaid(client), price);
  const towardSystem = Math.round((paid * systemPriceOf(client)) / price);
  return part === "system" ? towardSystem : paid - towardSystem;
}

export function owedFor(client: PricedClient & PaidClient, part: ProjectPart) {
  const price = part === "system" ? systemPriceOf(client) : docuPriceOf(client);
  return Math.max(0, price - paidToward(client, part));
}

/** Of the money actually collected, the portion that ends up yours. */
export function myCollected(client: PartneredClient & PaidClient) {
  const price = totalPrice(client);
  if (price <= 0) return 0;

  const collected = Math.min(totalPaid(client), price);
  return Math.round((collected * myIncome(client)) / price);
}
