import type { WORK_STATUS } from "@prisma/client";

export type Task = {
  id: number;
  clientId: number;
  title: string;
  notes: string | null;
  status: WORK_STATUS;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: number;
  userId: number;
  name: string;
  notes: string | null;
  status: WORK_STATUS;
  dueDate: string | null;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
};
