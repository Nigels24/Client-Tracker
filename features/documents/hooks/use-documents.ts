import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  uploadDocument,
  deleteDocument,
  UploadDocumentInput,
} from "@/features/documents/services/documents.api";

/**
 * Documents arrive nested inside the client query, so there's no documents
 * query of its own — mutations just invalidate the client keys, like tasks do.
 */
export function useUploadDocument(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<UploadDocumentInput, "clientId">) =>
      uploadDocument({ ...input, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useDeleteDocument(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}
