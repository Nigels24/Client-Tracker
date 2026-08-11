import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .required("Email is required.")
    .email("Enter a valid email address."),
  password: yup.string().required("Password is required."),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;

export const registerSchema = yup.object({
  name: yup.string().trim().required("Name is required."),
  email: yup
    .string()
    .trim()
    .lowercase()
    .required("Email is required.")
    .email("Enter a valid email address."),
  password: yup
    .string()
    .required("Password is required.")
    .min(8, "Password must be at least 8 characters."),
});

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
