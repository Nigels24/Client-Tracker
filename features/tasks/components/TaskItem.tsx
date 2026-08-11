"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { STATUS_OPTIONS, isOverdue } from "@/lib/status";
import { useUpdateTask, useDeleteTask } from "@/features/tasks/hooks/use-tasks";
import EditTaskModal from "@/features/tasks/components/EditTaskModal";
import type { Task } from "@/features/clients/types";
import type { WORK_STATUS } from "@prisma/client";

export default function TaskItem({
  task,
  clientId,
}: {
  task: Task;
  clientId: number;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const updateTask = useUpdateTask(clientId);
  const deleteTask = useDeleteTask(clientId);
  const overdue = isOverdue(task.dueDate, task.status);

  const handleDelete = async () => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await deleteTask.mutateAsync(task.id);
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-card-border bg-card-bg p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{task.title}</p>
        {task.notes && (
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{task.notes}</p>
        )}
        {task.dueDate && (
          <p className={`mt-1 text-xs ${overdue ? "font-medium text-overdue-text" : "text-muted"}`}>
            {overdue ? "Overdue: " : "Due "}
            {format(new Date(task.dueDate), "MMM d, yyyy")}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={task.status}
          onChange={(e) =>
            updateTask.mutate({ id: task.id, input: { status: e.target.value as WORK_STATUS } })
          }
          className="rounded-[9px] border border-card-border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/[0.2]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Edit task"
          className="rounded-full p-1.5 text-muted hover:bg-background cursor-pointer"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Delete task"
          className="rounded-full p-1.5 text-overdue-text hover:bg-overdue-bg cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <EditTaskModal
        task={task}
        clientId={clientId}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
