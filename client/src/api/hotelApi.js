import { apiClient } from '@/api/client';

export const getHotels = async () => {
  const { data } = await apiClient.get('hotels');
  return data;
};

export const getFeaturedHotels = async () => {
  const { data } = await apiClient.get('hotels', { params: { featured: 'true' } });
  return data;
};

export const getHotelDetails = async (hotelId) => {
  const { data } = await apiClient.get(`hotels/${hotelId}`);
  return data;
};

export const searchHotels = async (params, filters) => {
  const queryParams = {
    location: params.location?.trim() || undefined,
  };

  // Map filters to query params
  if (filters?.minPrice !== undefined) queryParams.minPrice = filters.minPrice;
  if (filters?.maxPrice !== undefined && filters.maxPrice > 0) queryParams.maxPrice = filters.maxPrice;
  
  if (filters?.stars?.length) {
    queryParams.stars = filters.stars.join(',');
  }
  if (filters?.amenities?.length) {
    queryParams.amenities = filters.amenities.join(',');
  }

  const { data } = await apiClient.get('hotels/search', { params: queryParams });

  // Fallback frontend sorting
  let result = [...data];
  switch (filters?.sortBy) {
    case 'price-asc':
      return result.sort((a, b) => a.pricePerNight - b.pricePerNight);
    case 'price-desc':
      return result.sort((a, b) => b.pricePerNight - a.pricePerNight);
    case 'rating':
      return result.sort((a, b) => b.rating - a.rating);
    default:
      return result.sort((a, b) => b.featured === a.featured ? b.rating - a.rating : Number(b.featured) - Number(a.featured));
  }
};

export const createBooking = async (payload) => {
  // Ensure payload sends the proper fields backend expects
  const requestBody = {
    ...payload,
    // Add missing mockData details if needed, but backend takes:
    // hotelId, roomTypeId, checkIn, checkOut, guests, fullName, email, phone
  };

  const { data } = await apiClient.post('bookings', requestBody);
  return data;
};

export const getUserBookings = async () => {
  const { data } = await apiClient.get('bookings/user');
  return data;
};

// Admin Operations
export const createHotel = async (payload) => {
  const { data } = await apiClient.post('hotels', payload);
  return data;
};

export const updateHotel = async ({ id, ...payload }) => {
  const { data } = await apiClient.put(`hotels/${id}`, payload);
  return data;
};

export const deleteHotel = async (id) => {
  const { data } = await apiClient.delete(`hotels/${id}`);
  return data;
};

