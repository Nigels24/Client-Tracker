import { LoginFormValues, RegisterFormValues } from "@/features/auth/schema/auth.schema";

export type AuthUser = { id: number; email: string; name: string };

async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Something went wrong.");
  }
  return body.data as T;
}

export async function login(values: LoginFormValues) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return unwrap<AuthUser>(response);
}

export async function register(values: RegisterFormValues) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return unwrap<AuthUser>(response);
}

export async function logout() {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to log out.");
  }
}

export async function fetchCurrentUser() {
  const response = await fetch("/api/auth/me");
  if (response.status === 401) return null;
  return unwrap<AuthUser>(response);
}
