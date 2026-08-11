import { WORK_STATUS } from "@prisma/client";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";

export default function Chip({ status }: { status: WORK_STATUS }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
