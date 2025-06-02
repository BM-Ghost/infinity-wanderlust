import { useQuery } from "@tanstack/react-query";
import { fetchUploads } from "@/lib/uploads";

export const useUploads = (page: number) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-uploads", page],
    queryFn: () => fetchUploads(),
    enabled: !!page,
    retry: 2
  });

 return {
    data: data,
    isLoading,
    isError
  };
};