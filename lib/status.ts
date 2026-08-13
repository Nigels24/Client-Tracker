import { PROJECT_TYPE, WORK_STATUS } from "@prisma/client";
import { hasDocu, hasSystem } from "@/lib/project-type";

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

export type Deadline = {
  label: "Docu" | "System";
  date: Date | string;
};

type ScheduledClient = {
  projectType: PROJECT_TYPE;
  systemDueDate: Date | string | null;
  docuDueDate: Date | string | null;
};

/** The deadlines that actually apply to this project type, earliest first. */
export function clientDeadlines(client: ScheduledClient): Deadline[] {
  const deadlines: Deadline[] = [];
  if (hasDocu(client.projectType) && client.docuDueDate) {
    deadlines.push({ label: "Docu", date: client.docuDueDate });
  }
  if (hasSystem(client.projectType) && client.systemDueDate) {
    deadlines.push({ label: "System", date: client.systemDueDate });
  }
  return deadlines.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * The earliest applicable deadline — including one already past, since an
 * overdue deliverable is the thing that most needs attention.
 */
export function nextDeadline(client: ScheduledClient): Deadline | null {
  return clientDeadlines(client)[0] ?? null;
}
