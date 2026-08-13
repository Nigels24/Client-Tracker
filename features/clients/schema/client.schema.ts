import * as yup from "yup";
import { PROJECT_TYPE } from "@prisma/client";

/**
 * An empty number input yields NaN, which yup would otherwise reject before the
 * `.optional()` ever applies — so blank it back to undefined first.
 */
const optionalPeso = yup
  .number()
  .transform((value, original) =>
    original === "" || original === null || Number.isNaN(value) ? undefined : value
  )
  .integer("Use whole pesos, no centavos.")
  .min(0, "Price can't be negative.")
  .optional();

/**
 * A wholly empty row is dropped on submit (the form always shows one), but a
 * row with contact details and no name is a mistake worth flagging.
 */
const memberSchema = yup.object({
  name: yup
    .string()
    .trim()
    .default("")
    .when("contact", {
      is: (contact: string | undefined) => Boolean(contact?.trim()),
      then: (schema) => schema.required("Add a name for this member."),
    }),
  contact: yup.string().trim().default("").optional(),
});

export const clientSchema = yup.object({
  title: yup.string().trim().required("Project title is required."),
  members: yup.array().of(memberSchema).default([]),
  school: yup.string().trim().optional(),
  course: yup.string().trim().optional(),
  projectType: yup
    .mixed<PROJECT_TYPE>()
    .oneOf(Object.values(PROJECT_TYPE))
    .required("Pick what you're building."),
  systemPrice: optionalPeso,
  docuPrice: optionalPeso,
  systemDueDate: yup.string().trim().optional(),
  docuDueDate: yup.string().trim().optional(),
  notes: yup.string().trim().optional(),
});

export type ClientFormValues = yup.InferType<typeof clientSchema>;

/**
 * Drops the blank rows the form always carries. A row with a contact but no
 * name never gets here — `memberSchema` rejects it first.
 */
export function toMemberInputs(members: ClientFormValues["members"]) {
  return (members ?? [])
    .filter((member) => member.name?.trim() || member.contact?.trim())
    .map((member) => ({
      name: member.name?.trim() ?? "",
      contact: member.contact?.trim() || undefined,
    }));
}
