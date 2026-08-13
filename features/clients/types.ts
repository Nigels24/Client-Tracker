import type { PROJECT_TYPE, WORK_STATUS } from "@prisma/client";

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

export type Payment = {
  id: number;
  clientId: number;
  /** Whole pesos — see lib/money.ts. */
  amount: number;
  paidAt: string;
  label: string | null;
  method: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientDocument = {
  id: number;
  clientId: number;
  label: string;
  fileName: string;
  mimeType: string;
  /** Bytes. */
  size: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientMember = {
  id: number;
  clientId: number;
  name: string;
  contact: string | null;
  /** 0 is the main contact. */
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: number;
  userId: number;
  title: string;
  school: string | null;
  course: string | null;
  notes: string | null;
  projectType: PROJECT_TYPE;
  status: WORK_STATUS;
  /** Whole pesos — see lib/money.ts. */
  systemPrice: number | null;
  docuPrice: number | null;
  /** Who referred this client; null means the whole price is yours. */
  partnerName: string | null;
  /** Percent of the *system* price owed to that partner. */
  partnerSharePercent: number;
  systemDueDate: string | null;
  docuDueDate: string | null;
  members: ClientMember[];
  tasks: Task[];
  payments: Payment[];
  documents: ClientDocument[];
  createdAt: string;
  updatedAt: string;
};
