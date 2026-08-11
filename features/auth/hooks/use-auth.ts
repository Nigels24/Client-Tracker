import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  login,
  logout,
  register,
  fetchCurrentUser,
} from "@/features/auth/services/auth.api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
