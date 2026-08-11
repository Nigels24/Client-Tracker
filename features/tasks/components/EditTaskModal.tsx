"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { format } from "date-fns";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import TextArea from "@/components/ui/TextArea";
import DateInput from "@/components/ui/DateInput";
import Button from "@/components/ui/Button";
import AlertBanner from "@/components/ui/AlertBanner";
import { taskSchema, TaskFormValues } from "@/features/tasks/schema/task.schema";
import { useUpdateTask } from "@/features/tasks/hooks/use-tasks";
import type { Task } from "@/features/clients/types";

export default function EditTaskModal({
  task,
  clientId,
  open,
  onClose,
}: {
  task: Task;
  clientId: number;
  open: boolean;
  onClose: () => void;
}) {
  const updateTask = useUpdateTask(clientId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: yupResolver(taskSchema),
    defaultValues: {
      title: task.title,
      notes: task.notes ?? "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task.title,
        notes: task.notes ?? "",
        dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task.id]);

  const handleClose = () => {
    updateTask.reset();
    onClose();
  };

  const onSubmit = async (values: TaskFormValues) => {
    await updateTask.mutateAsync({
      id: task.id,
      input: {
        title: values.title,
        notes: values.notes || null,
        dueDate: values.dueDate || null,
      },
    });
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Edit task">
      {updateTask.isError && (
        <div className="mb-4">
          <AlertBanner variant="error">
            {(updateTask.error as Error).message}
          </AlertBanner>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextInput
          label="Task title"
          required
          registration={register("title")}
          error={errors.title}
        />
        <TextArea label="Notes" registration={register("notes")} error={errors.notes} />
        <DateInput label="Due date" registration={register("dueDate")} error={errors.dueDate} />
        <div className="flex justify-end gap-2 pt-2">
          <Button label="Cancel" variant="outline" onClick={handleClose} type="button" />
          <Button
            label={isSubmitting ? "Saving..." : "Save changes"}
            type="submit"
            loading={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}
