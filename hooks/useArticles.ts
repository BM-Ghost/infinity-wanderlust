import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { fetchReviews, ReviewWithAuthor } from "@/lib/reviews";
import { ClientResponseError } from "pocketbase";

const ADMIN_EMAIL = 'infinitywanderlusttravels@gmail.com';

export interface ArticlesData {
  items: ReviewWithAuthor[];
  totalItems: number;
  totalPages: number;
  error?: string; // Optional error message from the API
}

interface UseArticlesOptions {
  page: number;
  perPage?: number;
  enabled?: boolean;
  initialData?: ArticlesData;
}

export const useArticles = ({
  page = 1,
  perPage = 9,
  enabled = true,
  initialData,
}: UseArticlesOptions) => {
  const queryClient = useQueryClient();
  const filter = `reviewer.email = '${ADMIN_EMAIL}'`;
  const sort = "-created";
  
  const queryOptions: UseQueryOptions<ArticlesData, Error> = {
    queryKey: ["articles", page, perPage, sort, filter],
    queryFn: async () => {
      try {
        const result = await fetchReviews(page, perPage, sort, filter);
        return {
          items: result.items as ReviewWithAuthor[],
          totalItems: result.totalItems,
          totalPages: result.totalPages,
          // Include error from fetchReviews if any
          ...(result.error && { error: result.error })
        };
      } catch (error) {
        if (error instanceof ClientResponseError && !navigator.onLine) {
          // Return cached data if offline
          const cachedData = queryClient.getQueryData<ArticlesData>(["articles", page, perPage, sort, filter]);
          
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
    gcTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
  };

  // Add initialData to options if provided
  if (initialData) {
    queryOptions.initialData = initialData;
  }

  return useQuery<ArticlesData, Error>(queryOptions);
};
