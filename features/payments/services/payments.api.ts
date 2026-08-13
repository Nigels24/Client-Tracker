import type { Payment } from "@/features/clients/types";

async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Something went wrong.");
  }
  return body.data as T;
}

export type CreatePaymentInput = {
  clientId: number;
  /** Whole pesos — see lib/money.ts. */
  amount: number;
  paidAt: string;
  label?: string;
  method?: string;
};

export async function createPayment(input: CreatePaymentInput) {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<Payment>(response);
}

export type UpdatePaymentInput = {
  amount?: number;
  paidAt?: string;
  label?: string | null;
  method?: string | null;
};

export async function updatePayment(id: number, input: UpdatePaymentInput) {
  const response = await fetch(`/api/payments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<Payment>(response);
}

export async function deletePayment(id: number) {
  const response = await fetch(`/api/payments/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message || "Failed to delete payment.");
  }
}
