import type { ClientDocument } from "@/features/clients/types";

async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Something went wrong.");
  }
  return body.data as T;
}

export type UploadDocumentInput = {
  clientId: number;
  file: File;
  label?: string;
};

/**
 * Multipart, so no Content-Type header — the browser sets it with the boundary.
 */
export async function uploadDocument({ clientId, file, label }: UploadDocumentInput) {
  const form = new FormData();
  form.append("clientId", String(clientId));
  form.append("file", file);
  if (label) form.append("label", label);

  const response = await fetch("/api/documents", { method: "POST", body: form });
  return unwrap<ClientDocument>(response);
}

export async function deleteDocument(id: number) {
  const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message || "Failed to delete file.");
  }
}

/** Files are only reachable through this authenticated route. */
export function documentViewUrl(id: number) {
  return `/api/documents/${id}/view`;
}
