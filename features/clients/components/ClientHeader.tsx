"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import SelectField from "@/components/ui/SelectField";
import { STATUS_OPTIONS, isOverdue } from "@/lib/status";
import { useUpdateClient, useDeleteClient } from "@/features/clients/hooks/use-clients";
import EditClientModal from "@/features/clients/components/EditClientModal";
import type { Client } from "@/features/clients/types";
import type { WORK_STATUS } from "@prisma/client";

export default function ClientHeader({ client }: { client: Client }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const updateClient = useUpdateClient(client.id);
  const deleteClient = useDeleteClient();
  const overdue = isOverdue(client.dueDate, client.status);

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${client.name}? This also deletes its tasks.`)) return;
    await deleteClient.mutateAsync(client.id);
    router.push("/dashboard");
  };

  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-5 sm:p-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to clients
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
          {client.notes && (
            <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm text-muted">
              {client.notes}
            </p>
          )}
          {client.dueDate && (
            <p className={`mt-2 text-xs ${overdue ? "font-medium text-overdue-text" : "text-muted"}`}>
              {overdue ? "Overdue: " : "Due "}
              {format(new Date(client.dueDate), "MMM d, yyyy")}
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="w-40">
            <SelectField
              options={STATUS_OPTIONS}
              value={client.status}
              onChange={(e) =>
                updateClient.mutate({ status: e.target.value as WORK_STATUS })
              }
            />
          </div>
          <Button
            label="Edit"
            variant="outline"
            size="sm"
            icon={<Pencil size={14} />}
            onClick={() => setEditOpen(true)}
          />
          <Button
            label="Delete"
            variant="danger_outline"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={handleDelete}
            loading={deleteClient.isPending}
          />
        </div>
      </div>

      <EditClientModal client={client} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
