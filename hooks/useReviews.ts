import { useQuery } from "@tanstack/react-query";
import { fetchReviews } from "@/lib/reviews";

export const useReviews = (page: number) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-reviews", page],
    queryFn: () => fetchReviews(page),
    enabled: !!page,
    retry: 2
  });

 return {
    data: data?.items,
    isLoading,
    isError
  };
};