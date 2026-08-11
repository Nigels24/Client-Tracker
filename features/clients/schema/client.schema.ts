import * as yup from "yup";

export const clientSchema = yup.object({
  name: yup.string().trim().required("Client name is required."),
  notes: yup.string().trim().optional(),
  dueDate: yup.string().trim().optional(),
});

export type ClientFormValues = yup.InferType<typeof clientSchema>;
