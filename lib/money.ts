import { PAYMENT_FOR, PROJECT_TYPE } from "@prisma/client";
import { PROJECT_TYPE_STYLES, hasDocu, hasSystem } from "@/lib/project-type";

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
  payments: { amount: number; appliesTo?: PAYMENT_FOR | null }[];
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

/*
 * Per-part breakdown for BOTH jobs. Each payment may say which half it pays
 * for (`appliesTo`); payments nobody has assigned yet count toward the combined
 * figures above but toward neither part below. The combined figures are
 * unaffected by any of this.
 */

export const PAYMENT_FOR_LABELS: Record<PAYMENT_FOR, string> = {
  SYSTEM: "System",
  DOCU: "Docu",
};

export const PAYMENT_FOR_STYLES: Record<PAYMENT_FOR, string> = {
  SYSTEM: PROJECT_TYPE_STYLES.SYSTEM,
  DOCU: PROJECT_TYPE_STYLES.DOCU,
};

export const PAYMENT_FOR_OPTIONS: { value: PAYMENT_FOR; label: string }[] = (
  Object.keys(PAYMENT_FOR_LABELS) as PAYMENT_FOR[]
).map((value) => ({ value, label: PAYMENT_FOR_LABELS[value] }));

/**
 * What a payment's `appliesTo` must be for this project type: a single-part job
 * can only be paying for that part, so only BOTH jobs keep the requested value.
 */
export function paymentPartFor(
  projectType: PROJECT_TYPE,
  requested: PAYMENT_FOR | null
): PAYMENT_FOR | null {
  if (projectType === "SYSTEM") return "SYSTEM";
  if (projectType === "DOCU") return "DOCU";
  return requested;
}

/** The price of one part, or 0 if the project type doesn't include it. */
export function partPrice(client: PricedClient, part: PAYMENT_FOR) {
  if (part === "SYSTEM") {
    return hasSystem(client.projectType) ? client.systemPrice ?? 0 : 0;
  }
  return hasDocu(client.projectType) ? client.docuPrice ?? 0 : 0;
}

export function paidFor(client: PaidClient, part: PAYMENT_FOR) {
  return client.payments
    .filter((payment) => payment.appliesTo === part)
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function unassignedPaid(client: PaidClient) {
  return client.payments
    .filter((payment) => !payment.appliesTo)
    .reduce((sum, payment) => sum + payment.amount, 0);
}

/** Negative when that part has been overpaid. */
export function partBalance(client: PricedClient & PaidClient, part: PAYMENT_FOR) {
  return partPrice(client, part) - paidFor(client, part);
}

/** 0-100, for ProgressBar. Returns 0 when that part has no price. */
export function partProgress(client: PricedClient & PaidClient, part: PAYMENT_FOR) {
  const price = partPrice(client, part);
  if (price <= 0) return 0;
  return Math.min(100, Math.round((paidFor(client, part) / price) * 100));
}
