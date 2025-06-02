import { useQuery } from "@tanstack/react-query";
import { getUsers } from "./use-pb-users";

export const useUsers = (page: number) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-users", page],
    queryFn: () => getUsers({ page }),
    enabled: !!page,
    retry: 2
  });

 return {
    data: data,
    isLoading,
    isError
  };
};