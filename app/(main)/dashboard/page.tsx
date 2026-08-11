"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useClients } from "@/features/clients/hooks/use-clients";
import ClientCard from "@/features/clients/components/ClientCard";
import AddClientModal from "@/features/clients/components/AddClientModal";
import StatusFilterBar from "@/features/clients/components/StatusFilterBar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function DashboardPage() {
  const [status, setStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { data: clients, isLoading } = useClients(status ? { status } : {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Your clients</h1>
        <Button
          label="Add client"
          icon={<Plus size={16} />}
          onClick={() => setAddOpen(true)}
        />
      </div>

      <StatusFilterBar value={status} onChange={setStatus} />

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={status ? "No clients with this status" : "No clients yet"}
          description={
            status
              ? "Try a different filter, or add a new client."
              : "Add your first client to start tracking their progress."
          }
          action={
            !status && (
              <Button
                label="Add client"
                icon={<Plus size={16} />}
                onClick={() => setAddOpen(true)}
              />
            )
          }
        />
      )}

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
