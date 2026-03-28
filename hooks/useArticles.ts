import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { fetchReviews, isBlogReview, ReviewWithAuthor } from "@/lib/reviews";
import { ClientResponseError } from "pocketbase";

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
  const sort = "-created";
  
  const queryOptions: UseQueryOptions<ArticlesData, Error> = {
    queryKey: ["articles", page, perPage, sort],
    queryFn: async () => {
      try {
        const result = await fetchReviews(1, 200, sort, "");
        const blogItems = (result.items as ReviewWithAuthor[]).filter((item) => isBlogReview(item));
        const totalItems = blogItems.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
        const startIndex = (page - 1) * perPage;
        const paginatedItems = blogItems.slice(startIndex, startIndex + perPage);

        return {
          items: paginatedItems,
          totalItems,
          totalPages,
          // Include error from fetchReviews if any
          ...(result.error && { error: result.error })
        };
      } catch (error) {
        if (error instanceof ClientResponseError && !navigator.onLine) {
          // Return cached data if offline
          const cachedData = queryClient.getQueryData<ArticlesData>(["articles", page, perPage, sort]);
          
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
