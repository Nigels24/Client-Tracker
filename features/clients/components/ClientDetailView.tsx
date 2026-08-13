"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useClient } from "@/features/clients/hooks/use-clients";
import ClientHeader from "@/features/clients/components/ClientHeader";
import PaymentsPanel from "@/features/payments/components/PaymentsPanel";
import AgreementPanel from "@/features/documents/components/AgreementPanel";
import TaskList from "@/features/tasks/components/TaskList";
import EmptyState from "@/components/ui/EmptyState";

export default function ClientDetailView({ clientId }: { clientId: number }) {
  const { data: client, isLoading, isError } = useClient(clientId);

  if (isLoading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (isError || !client) {
    return (
      <EmptyState
        title="Client not found"
        description="It may have been deleted, or it doesn't belong to your account."
        action={
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
            <ArrowLeft size={14} />
            Back to clients
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ClientHeader client={client} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentsPanel client={client} />
        <AgreementPanel client={client} />
      </div>
      <TaskList clientId={client.id} tasks={client.tasks} />
    </div>
  );
}
