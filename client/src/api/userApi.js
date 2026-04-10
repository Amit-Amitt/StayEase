import { apiClient } from '@/api/client';

export const getUserProfile = async () => {
  const { data } = await apiClient.get('/users/profile');
  return data;
};

export const updateUserProfile = async (payload) => {
  const { data } = await apiClient.put('/users/profile', payload);
  return data;
};

export const toggleSaveHotel = async (hotelId) => {
  const { data } = await apiClient.post(`/users/save-hotel/${hotelId}`);
  return data;
};
