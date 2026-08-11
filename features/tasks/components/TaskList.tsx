"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import TaskItem from "@/features/tasks/components/TaskItem";
import AddTaskForm from "@/features/tasks/components/AddTaskForm";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import StatusFilterBar from "@/features/clients/components/StatusFilterBar";
import type { Task } from "@/features/clients/types";

const PAGE_SIZE = 10;

export default function TaskList({
  clientId,
  tasks,
}: {
  clientId: number;
  tasks: Task[];
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const filteredTasks = statusFilter
    ? tasks.filter((task) => task.status === statusFilter)
    : tasks;

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedTasks = filteredTasks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">
        Tasks
      </h2>

      {tasks.length > 0 && (
        <div className="mb-4">
          <StatusFilterBar value={statusFilter} onChange={handleStatusFilterChange} />
        </div>
      )}

      {pagedTasks.length > 0 ? (
        <div className="mb-4 space-y-2">
          {pagedTasks.map((task) => (
            <TaskItem key={task.id} task={task} clientId={clientId} />
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <EmptyState
            icon={ListChecks}
            title={tasks.length === 0 ? "No tasks yet" : "No tasks with this status"}
            description={
              tasks.length === 0
                ? "Add the first task below."
                : "Try a different filter."
            }
          />
        </div>
      )}

      {pageCount > 1 && (
        <div className="mb-4">
          <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}

      <AddTaskForm clientId={clientId} />
    </div>
  );
}
