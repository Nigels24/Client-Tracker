/**
 * Every client response carries its tasks, payments and documents, so the
 * browser can compute progress, balances and badges without extra round trips.
 * Shared so the four client queries can't drift apart.
 */

/**
 * `url`/`pathname`/`access` are deliberately withheld — the browser reaches a
 * file only through /api/documents/[id]/view, which checks the session first.
 */
export const documentSelect = {
  id: true,
  clientId: true,
  label: true,
  fileName: true,
  mimeType: true,
  size: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const clientInclude = {
  tasks: { orderBy: { position: "asc" } },
  payments: { orderBy: { paidAt: "desc" } },
  documents: { orderBy: { createdAt: "desc" }, select: documentSelect },
} as const;
