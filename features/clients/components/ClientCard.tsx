import Link from "next/link";
import { format } from "date-fns";
import Chip from "@/components/ui/Chip";
import ProgressBar from "@/components/ui/ProgressBar";
import { isOverdue } from "@/lib/status";
import type { Client } from "@/features/clients/types";

export default function ClientCard({ client }: { client: Client }) {
  const total = client.tasks.length;
  const done = client.tasks.filter((task) => task.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdue = isOverdue(client.dueDate, client.status);

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block rounded-2xl border border-card-border bg-card-bg p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{client.name}</h3>
        <Chip status={client.status} />
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>
            {done}/{total} tasks
          </span>
          {client.dueDate && (
            <span className={overdue ? "font-medium text-overdue-text" : ""}>
              {overdue ? "Overdue: " : "Due "}
              {format(new Date(client.dueDate), "MMM d")}
            </span>
          )}
        </div>
        <ProgressBar value={progress} />
      </div>
    </Link>
  );
}
