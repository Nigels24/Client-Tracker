import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  createTask,
  updateTask,
  deleteTask,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/features/tasks/services/tasks.api";

export function useCreateTask(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreateTaskInput, "clientId">) =>
      createTask({ ...input, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateTask(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTaskInput }) =>
      updateTask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useDeleteTask(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
