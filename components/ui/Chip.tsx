import { WORK_STATUS } from "@prisma/client";
import Badge from "@/components/ui/Badge";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";

export default function Chip({ status }: { status: WORK_STATUS }) {
  return <Badge label={STATUS_LABELS[status]} className={STATUS_STYLES[status]} dot />;
}
