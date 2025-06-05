import { useQuery } from "@tanstack/react-query";
import { fetchUserBookings } from "@/lib/travel-bookings";

export const useBookings = (userId: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-bookings", userId],
    queryFn: () => fetchUserBookings(userId),
    enabled: !!userId, // Only run if userId is truthy
    retry: 2,
    staleTime: 0,
  });
  console.log("useBookings data:", data);
  console.log("userId:", userId);

  return {
    data: data,
    isLoading,
    isError
  };
};