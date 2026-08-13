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

export const clientSchema = yup.object({
  title: yup.string().trim().required("Project title is required."),
  name: yup.string().trim().optional(),
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
