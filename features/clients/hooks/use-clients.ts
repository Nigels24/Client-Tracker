import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys, ClientFilters } from "@/lib/query/keys";
import {
  fetchClients,
  fetchClient,
  createClient,
  updateClient,
  deleteClient,
  CreateClientInput,
  UpdateClientInput,
} from "@/features/clients/services/clients.api";

export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters),
    queryFn: () => fetchClients(filters),
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => fetchClient(id),
    enabled: Number.isInteger(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateClient(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClientInput) => updateClient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
