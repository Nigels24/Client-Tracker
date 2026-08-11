import type { WORK_STATUS } from "@prisma/client";
import type { Client } from "@/features/clients/types";
import type { ClientFilters } from "@/lib/query/keys";

async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Something went wrong.");
  }
  return body.data as T;
}

export async function fetchClients(filters: ClientFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  const response = await fetch(`/api/clients?${params.toString()}`);
  return unwrap<Client[]>(response);
}

export async function fetchClient(id: number) {
  const response = await fetch(`/api/clients/${id}`);
  return unwrap<Client>(response);
}

export type CreateClientInput = {
  name: string;
  notes?: string;
  dueDate?: string;
};

export async function createClient(input: CreateClientInput) {
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<Client>(response);
}

export type UpdateClientInput = {
  name?: string;
  notes?: string | null;
  status?: WORK_STATUS;
  dueDate?: string | null;
};

export async function updateClient(id: number, input: UpdateClientInput) {
  const response = await fetch(`/api/clients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<Client>(response);
}

export async function deleteClient(id: number) {
  const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message || "Failed to delete client.");
  }
}
