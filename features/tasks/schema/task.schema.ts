import * as yup from "yup";

export const taskSchema = yup.object({
  title: yup.string().trim().required("Task title is required."),
  notes: yup.string().trim().optional(),
  dueDate: yup.string().trim().optional(),
});

export type TaskFormValues = yup.InferType<typeof taskSchema>;
