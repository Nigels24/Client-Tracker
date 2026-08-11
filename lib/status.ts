import { WORK_STATUS } from "@prisma/client";

export const STATUS_LABELS: Record<WORK_STATUS, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  REVISIONS: "Revisions",
  DONE: "Done",
};

export const STATUS_STYLES: Record<WORK_STATUS, string> = {
  PENDING: "bg-status-pending-bg text-status-pending-text",
  IN_PROGRESS: "bg-status-in-progress-bg text-status-in-progress-text",
  REVISIONS: "bg-status-revisions-bg text-status-revisions-text",
  DONE: "bg-status-done-bg text-status-done-text",
};

export const STATUS_OPTIONS: { value: WORK_STATUS; label: string }[] = (
  Object.keys(STATUS_LABELS) as WORK_STATUS[]
).map((value) => ({ value, label: STATUS_LABELS[value] }));

export function isOverdue(dueDate: Date | string | null, status: WORK_STATUS) {
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate).getTime() < Date.now();
}
