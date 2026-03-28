import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserBookings } from "@/lib/travel-bookings";
import { ClientResponseError } from "pocketbase";

export const useBookings = (userId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["all-bookings", userId],
    queryFn: async () => {
      try {
        if (!userId) {
          return { items: [], error: "No user ID provided" };
        }
        return await fetchUserBookings(userId);
      } catch (err) {
        // Handle offline scenarios
        if (err instanceof ClientResponseError && !navigator.onLine) {
          const cachedData = queryClient.getQueryData(["all-bookings", userId]);
          if (cachedData) {
            return cachedData;
          }
        }

        // Return error in data structure
        if (err instanceof Error) {
          console.error("useBookings error:", err);
          return { items: [], error: err.message };
        }

        return { items: [], error: "An unknown error occurred" };
      }
    },
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (error instanceof ClientResponseError && !navigator.onLine) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  return {
    data: data || { items: [], error: undefined },
    isLoading,
    isError,
    error: error?.message || data?.error,
  }
}