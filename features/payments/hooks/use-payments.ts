import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  createPayment,
  updatePayment,
  deletePayment,
  CreatePaymentInput,
  UpdatePaymentInput,
} from "@/features/payments/services/payments.api";

/**
 * Payments arrive nested inside the client query, so there's no payments query
 * of its own — mutations just invalidate the client keys, same as tasks do.
 */
export function useCreatePayment(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreatePaymentInput, "clientId">) =>
      createPayment({ ...input, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdatePayment(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePaymentInput }) =>
      updatePayment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useDeletePayment(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
