import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { fetchReviews, ReviewWithAuthor } from "@/lib/reviews";
import { ClientResponseError } from "pocketbase";

export interface ReviewsData {
  items: ReviewWithAuthor[];
  totalItems: number;
  totalPages: number;
  error?: string; // Optional error message from the API
}

interface UseReviewsOptions {
  page: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  enabled?: boolean;
  initialData?: ReviewsData;
}

export const useReviews = ({
  page = 1,
  perPage = 10,
  sort = "-created",
  filter = "",
  enabled = true,
  initialData,
}: UseReviewsOptions) => {
  const queryClient = useQueryClient();
  
  const queryOptions: UseQueryOptions<ReviewsData, Error> = {
    queryKey: ["all-reviews", page, perPage, sort, filter],
    queryFn: async () => {
      try {
        return await fetchReviews(page, perPage, sort, filter);
      } catch (error) {
        if (error instanceof ClientResponseError && !navigator.onLine) {
          // Return cached data if offline
          const cachedData = queryClient.getQueryData<ReviewsData>(["all-reviews", page, perPage, sort, filter]);
          
          if (cachedData) {
            return cachedData;
          }
          
          // Return initial data if available
          if (initialData) {
            return initialData;
          }
        }
        
        // Return empty result with error to prevent UI crashes
        if (error instanceof Error) {
          return { 
            items: [], 
            totalItems: 0, 
            totalPages: 0,
            error: error.message
          };
        }
        
        // Fallback for non-Error throwables
        return { 
          items: [], 
          totalItems: 0, 
          totalPages: 0,
          error: 'An unknown error occurred'
        };
      }
    },
    enabled: enabled && !!page,
    retry: (failureCount, error) => {
      // Don't retry if we're offline
      if (error instanceof ClientResponseError && !navigator.onLine) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (cacheTime was renamed to gcTime in v5)
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  };

  // Add initialData to options if provided
  if (initialData) {
    queryOptions.initialData = initialData;
  }

  return useQuery<ReviewsData, Error>(queryOptions);
};