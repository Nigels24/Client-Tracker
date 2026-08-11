"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCreateTask } from "@/features/tasks/hooks/use-tasks";

const quickAddSchema = yup.object({
  title: yup.string().trim().required("Task title is required."),
});

type QuickAddValues = yup.InferType<typeof quickAddSchema>;

export default function AddTaskForm({ clientId }: { clientId: number }) {
  const createTask = useCreateTask(clientId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickAddValues>({
    resolver: yupResolver(quickAddSchema),
    defaultValues: { title: "" },
  });

  const onSubmit = async (values: QuickAddValues) => {
    await createTask.mutateAsync({ title: values.title });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          {...register("title")}
          placeholder="Add a task…"
          className={`w-full px-4 py-2.5 rounded-[9px] text-sm border bg-white
          focus:outline-none focus:ring-2 focus:ring-brand/[0.2] transition-colors
          ${errors.title ? "border-red-500" : "border-card-border"}`}
        />
        {errors.title && (
          <p className="mt-1 text-xs font-medium text-red-500">{errors.title.message}</p>
        )}
      </div>
      <Button
        label="Add"
        type="submit"
        icon={<Plus size={16} />}
        loading={isSubmitting}
      />
    </form>
  );
}
