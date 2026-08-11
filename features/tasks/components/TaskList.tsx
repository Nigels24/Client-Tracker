import { ListChecks } from "lucide-react";
import TaskItem from "@/features/tasks/components/TaskItem";
import AddTaskForm from "@/features/tasks/components/AddTaskForm";
import EmptyState from "@/components/ui/EmptyState";
import type { Task } from "@/features/clients/types";

export default function TaskList({
  clientId,
  tasks,
}: {
  clientId: number;
  tasks: Task[];
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-card-bg p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold text-muted uppercase tracking-wide">
        Tasks
      </h2>

      {tasks.length > 0 ? (
        <div className="mb-4 space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} clientId={clientId} />
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <EmptyState icon={ListChecks} title="No tasks yet" description="Add the first task below." />
        </div>
      )}

      <AddTaskForm clientId={clientId} />
    </div>
  );
}
