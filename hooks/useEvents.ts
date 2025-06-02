import { useQuery } from "@tanstack/react-query";
import { fetchTravelEvents } from "@/lib/travel-events";

export const useEvents = (page: number) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-events", page],
    queryFn: () => fetchTravelEvents({ expand: String(page) }),
    enabled: !!page,
    retry: 2
  });

  return {
    data: data,
    isLoading,
    isError
  };
};