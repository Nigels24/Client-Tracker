"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SelectField from "@/components/ui/SelectField";
import { STATUS_OPTIONS, clientDeadlines, isOverdue } from "@/lib/status";
import { PROJECT_TYPE_LABELS, PROJECT_TYPE_STYLES, hasDocu, hasSystem } from "@/lib/project-type";
import { formatPeso } from "@/lib/money";
import { useUpdateClient, useDeleteClient } from "@/features/clients/hooks/use-clients";
import EditClientModal from "@/features/clients/components/EditClientModal";
import type { Client } from "@/features/clients/types";
import type { WORK_STATUS } from "@prisma/client";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function ClientHeader({ client }: { client: Client }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const updateClient = useUpdateClient(client.id);
  const deleteClient = useDeleteClient();

  const deadlines = clientDeadlines(client);
  const showSystemPrice = hasSystem(client.projectType) && client.systemPrice !== null;
  const showDocuPrice = hasDocu(client.projectType) && client.docuPrice !== null;
  // Nothing filled in yet shouldn't leave an empty bordered strip.
  const hasDetails =
    Boolean(client.school || client.course) ||
    showSystemPrice ||
    showDocuPrice ||
    deadlines.length > 0;

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${client.title}? This also deletes its tasks, payments and files.`))
      return;
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
          <h1 className="text-xl font-bold text-foreground">{client.title}</h1>
          {client.members.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {client.members.map((member, index) => (
                <li key={member.id} className="text-sm">
                  <span className="font-medium text-foreground">{member.name}</span>
                  {index === 0 && (
                    <span className="ml-2 text-xs text-muted">main contact</span>
                  )}
                  {member.contact && (
                    <span className="ml-2 text-xs text-muted">{member.contact}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">
              No members yet — add them with Edit
            </p>
          )}
          <div className="mt-3">
            <Badge
              label={PROJECT_TYPE_LABELS[client.projectType]}
              className={PROJECT_TYPE_STYLES[client.projectType]}
            />
          </div>
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

      {hasDetails && (
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-card-border pt-5 sm:grid-cols-3 lg:grid-cols-4">
          {client.school && <Detail label="School" value={client.school} />}
          {client.course && <Detail label="Course" value={client.course} />}
          {showSystemPrice && (
            <Detail label="System price" value={formatPeso(client.systemPrice)} />
          )}
          {showDocuPrice && (
            <Detail label="Docu price" value={formatPeso(client.docuPrice)} />
          )}
          {deadlines.map((deadline) => {
            const overdue = isOverdue(deadline.date, client.status);
            return (
              <Detail
                key={deadline.label}
                label={`${deadline.label} deadline`}
                value={
                  <span className={overdue ? "text-overdue-text" : undefined}>
                    {format(new Date(deadline.date), "MMM d, yyyy")}
                    {overdue && " · overdue"}
                  </span>
                }
              />
            );
          })}
        </dl>
      )}

      {client.notes && (
        <p className="mt-5 max-w-2xl whitespace-pre-wrap border-t border-card-border pt-5 text-sm text-muted">
          {client.notes}
        </p>
      )}

      <EditClientModal client={client} open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
