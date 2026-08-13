import Link from "next/link";
import { format } from "date-fns";
import Badge from "@/components/ui/Badge";
import Chip from "@/components/ui/Chip";
import ProgressBar from "@/components/ui/ProgressBar";
import { isOverdue, nextDeadline } from "@/lib/status";
import { PROJECT_TYPE_LABELS, PROJECT_TYPE_STYLES } from "@/lib/project-type";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  formatPeso,
  paymentStatus,
  totalPaid,
  totalPrice,
} from "@/lib/money";
import type { Client } from "@/features/clients/types";

export default function ClientCard({ client }: { client: Client }) {
  const total = client.tasks.length;
  const done = client.tasks.filter((task) => task.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const deadline = nextDeadline(client);
  const overdue = isOverdue(deadline?.date ?? null, client.status);

  const price = totalPrice(client);
  const payStatus = paymentStatus(client);
  const schooling = [client.school, client.course].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/clients/${client.id}`}
      className="flex flex-col rounded-2xl border border-card-border bg-card-bg p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{client.title}</h3>
        <Chip status={client.status} />
      </div>

      {client.name && (
        <p className="mt-1 text-sm text-muted">{client.name}</p>
      )}
      {schooling && (
        <p className="mt-0.5 text-xs text-muted">{schooling}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          label={PROJECT_TYPE_LABELS[client.projectType]}
          className={PROJECT_TYPE_STYLES[client.projectType]}
        />
        {payStatus && (
          <Badge
            label={PAYMENT_STATUS_LABELS[payStatus]}
            className={PAYMENT_STATUS_STYLES[payStatus]}
          />
        )}
      </div>

      {price > 0 && (
        <p className="mt-3 text-sm text-foreground">
          <span className="font-semibold">{formatPeso(totalPaid(client))}</span>
          <span className="text-muted"> / {formatPeso(price)}</span>
        </p>
      )}

      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between gap-2 text-xs text-muted">
          <span>
            {done}/{total} tasks
          </span>
          {deadline && (
            <span className={overdue ? "font-medium text-overdue-text" : ""}>
              {overdue ? `${deadline.label} overdue: ` : `${deadline.label} due `}
              {format(new Date(deadline.date), "MMM d")}
            </span>
          )}
        </div>
        <ProgressBar value={progress} />
      </div>
    </Link>
  );
}
