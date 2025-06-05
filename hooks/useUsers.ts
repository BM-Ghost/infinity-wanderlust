import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "./use-pb-users";
import type { UserRecord } from "./use-pb-users";

export const useUsers = (page: number) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserRecord[], Error>({
    queryKey: ["all-users", page],
    queryFn: () => fetchUsers({ page }),
    retry: 2,
    staleTime: 1000 * 60 * 5, // optional: cache for 5 minutes
  });

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
};
