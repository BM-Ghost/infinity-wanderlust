import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers } from "./use-pb-users";
import type { UserRecord } from "./use-pb-users";
import { ClientResponseError } from "pocketbase";

export const useUsers = (page: number) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserRecord[], Error>({
    queryKey: ["all-users", page],
    queryFn: async () => {
      try {
        return await fetchUsers({ page });
      } catch (err) {
        // Handle offline scenarios
        if (err instanceof ClientResponseError && !navigator.onLine) {
          const cachedData = queryClient.getQueryData<UserRecord[]>(["all-users", page]);
          if (cachedData) {
            return cachedData;
          }
        }
        throw err;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof ClientResponseError && !navigator.onLine) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
