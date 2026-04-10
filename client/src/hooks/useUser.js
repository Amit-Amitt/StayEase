import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, toggleSaveHotel } from '@/api/userApi';
import { useAuth } from '@/context/AuthContext';

export const useUserProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { login } = useAuth(); // Need to update context with new name/email natively

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['userProfile'], data);
      login({ email: data.email, name: data.name, role: data.role });
    },
  });
};

export const useToggleSaveHotel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleSaveHotel,
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
    },
  });
};
