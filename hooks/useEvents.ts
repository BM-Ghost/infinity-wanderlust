import { useQuery } from "@tanstack/react-query";
import { fetchTravelEvents } from "@/lib/travel-events";

export const useEvents = (page: number, eventId?: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-events", page],
    queryFn: () => fetchTravelEvents({ expand: String(page) }),
    retry: 2,
    staleTime: 0,
    select: (data) => {
      if (eventId) {
        return data.filter((event: any) => event.id === eventId);
      }
      return data;
    }
  });
  console.log("useEvents data:", data);

  return {
    data: data,
    isLoading,
    isError
  };
};