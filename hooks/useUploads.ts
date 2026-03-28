import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUploads } from "@/lib/uploads";
import { ClientResponseError } from "pocketbase";

export const useUploads = (page?: number) => {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["all-uploads", page || 1],
    queryFn: async () => {
      try {
        return await fetchUploads();
      } catch (err) {
        // Handle offline scenarios
        if (err instanceof ClientResponseError && !navigator.onLine) {
          const cachedData = queryClient.getQueryData(["all-uploads", page || 1]);
          if (cachedData) {
            return cachedData;
          }
        }

        // Return error in consistent format
        if (err instanceof Error) {
          console.error("useUploads error:", err);
          return { items: [], error: err.message };
        }

        return { items: [], error: "An unknown error occurred" };
      }
    },
    enabled: true,
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