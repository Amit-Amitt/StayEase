import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeaturedHotels, getHotelDetails, getHotels, searchHotels, createBooking, getUserBookings, createHotel, updateHotel, deleteHotel } from '@/api/hotelApi';

export const useHotels = () => 
  useQuery({ 
    queryKey: ['hotels'], 
    queryFn: getHotels,
    retry: 1, // Fail fast for better error handling compatibility
  });

export const useFeaturedHotels = () =>
  useQuery({ 
    queryKey: ['featured-hotels'], 
    queryFn: getFeaturedHotels,
    retry: 1, 
  });

export const useHotelDetails = (hotelId) =>
  useQuery({ 
    queryKey: ['hotel', hotelId], 
    queryFn: () => getHotelDetails(hotelId),
    enabled: !!hotelId,
    retry: false, // Don't retry 404s endlessly
  });

export const useSearchHotels = (params, filters) =>
  useQuery({
    queryKey: ['search-hotels', params, filters],
    queryFn: () => searchHotels(params, filters),
    retry: 1,
  });

export const useUserBookings = () =>
  useQuery({
    queryKey: ['user-bookings'],
    queryFn: getUserBookings,
    retry: 1,
  });

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createBooking(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-bookings'] }),
  });
};

export const useCreateHotel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createHotel(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hotels'] }),
  });
};

export const useUpdateHotel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateHotel(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      queryClient.invalidateQueries({ queryKey: ['hotel', variables.id] });
    },
  });
};

export const useDeleteHotel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteHotel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hotels'] }),
  });
};
