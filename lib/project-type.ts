import { PROJECT_TYPE } from "@prisma/client";

export const PROJECT_TYPE_LABELS: Record<PROJECT_TYPE, string> = {
  SYSTEM: "System",
  DOCU: "Thesis-Docu",
  BOTH: "Both",
};

export const PROJECT_TYPE_STYLES: Record<PROJECT_TYPE, string> = {
  SYSTEM: "bg-type-system-bg text-type-system-text",
  DOCU: "bg-type-docu-bg text-type-docu-text",
  BOTH: "bg-type-both-bg text-type-both-text",
};

export const PROJECT_TYPE_OPTIONS: { value: PROJECT_TYPE; label: string }[] = (
  Object.keys(PROJECT_TYPE_LABELS) as PROJECT_TYPE[]
).map((value) => ({ value, label: PROJECT_TYPE_LABELS[value] }));

/**
 * Which halves of the job a project type covers. Prices, deadlines and form
 * fields are all gated on these, so a Docu-only job never shows or counts a
 * system price.
 */
export function hasSystem(projectType: PROJECT_TYPE) {
  return projectType === "SYSTEM" || projectType === "BOTH";
}

export function hasDocu(projectType: PROJECT_TYPE) {
  return projectType === "DOCU" || projectType === "BOTH";
}
