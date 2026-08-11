import type { WORK_STATUS } from "@prisma/client";
import type { Task } from "@/features/clients/types";

async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Something went wrong.");
  }
  return body.data as T;
}

export type CreateTaskInput = {
  clientId: number;
  title: string;
  notes?: string;
  dueDate?: string;
};

export async function createTask(input: CreateTaskInput) {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<Task>(response);
}

export type UpdateTaskInput = {
  title?: string;
  notes?: string | null;
  status?: WORK_STATUS;
  dueDate?: string | null;
};

export async function updateTask(id: number, input: UpdateTaskInput) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return unwrap<Task>(response);
}

export async function deleteTask(id: number) {
  const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message || "Failed to delete task.");
  }
}
