import * as yup from "yup";

export const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "—" },
  { value: "GCash", label: "GCash" },
  { value: "Cash", label: "Cash" },
  { value: "Bank transfer", label: "Bank transfer" },
  { value: "Other", label: "Other" },
];

export const paymentSchema = yup.object({
  amount: yup
    .number()
    .transform((value, original) =>
      original === "" || original === null || Number.isNaN(value) ? undefined : value
    )
    .integer("Use whole pesos, no centavos.")
    .moreThan(0, "Enter how much they paid.")
    .required("Enter how much they paid."),
  paidAt: yup.string().trim().required("When was this paid?"),
  label: yup.string().trim().optional(),
  method: yup.string().trim().optional(),
});

export type PaymentFormValues = yup.InferType<typeof paymentSchema>;
