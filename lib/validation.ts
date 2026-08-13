/**
 * Small hand-rolled parsers for API route bodies. The yup schemas in each
 * feature's schema folder only run in the browser, so the server validates
 * independently — these keep that validation identical across routes.
 *
 * Parsers throw `ValidationError`; routes turn that into a 400 in their
 * existing catch block (see `respondToError`).
 */
import { NextResponse } from "next/server";

export class ValidationError extends Error {}

/** Turns a thrown error into the right response: 400 for bad input, 500 otherwise. */
export function respondToError(error: unknown) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ message: "Internal server error." }, { status: 500 });
}

export function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required.`);
  }
  return value.trim();
}

/** Empty strings collapse to null so clearing a field in the UI actually clears it. */
export function optionalText(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be text.`);
  }
  return value.trim() || null;
}

/** Whole pesos only — see lib/money.ts. */
export function optionalPeso(value: unknown, field: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new ValidationError(`${field} must be a whole number of pesos.`);
  }
  return amount;
}

export function requiredPeso(value: unknown, field: string): number {
  const amount = optionalPeso(value, field);
  if (amount === null || amount <= 0) {
    throw new ValidationError(`${field} must be greater than zero.`);
  }
  return amount;
}

export function optionalDate(value: unknown, field: string): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} is not a valid date.`);
  }
  return date;
}

export function requiredDate(value: unknown, field: string): Date {
  const date = optionalDate(value, field);
  if (!date) throw new ValidationError(`${field} is required.`);
  return date;
}

export type ParsedMember = { name: string; contact: string | null; position: number };

/**
 * The client form always renders at least one blank member row, so a wholly
 * empty row is silently dropped. A row with contact details but no name is a
 * genuine mistake and is rejected rather than quietly discarded.
 */
export function parseMembers(value: unknown): ParsedMember[] {
  if (!Array.isArray(value)) {
    throw new ValidationError("Members must be a list.");
  }
  if (value.length > 20) {
    throw new ValidationError("That's more than 20 members — is something wrong?");
  }

  const rows = value.map((entry) => (entry ?? {}) as { name?: unknown; contact?: unknown });

  return rows
    .filter((row) => {
      const blankName = !String(row.name ?? "").trim();
      const blankContact = !String(row.contact ?? "").trim();
      return !(blankName && blankContact);
    })
    .map((row, index) => ({
      name: requiredText(row.name, "Member name"),
      contact: optionalText(row.contact, "Member contact"),
      position: index,
    }));
}

export function enumValue<T extends Record<string, string>>(
  value: unknown,
  options: T,
  field: string
): T[keyof T] {
  if (typeof value !== "string" || !(value in options)) {
    throw new ValidationError(`Invalid ${field}.`);
  }
  return value as T[keyof T];
}
