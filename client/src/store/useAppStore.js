import { create } from 'zustand';

export const useAppStore = create((set) => ({
  user: {
    name: 'Amit Shah',
    email: 'amit@example.com',
  },
  selectedHotel: null,
  theme: 'light',
  setUser: (user) => set({ user }),
  setSelectedHotel: (selectedHotel) => set({ selectedHotel }),
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return { theme };
    }),
}));
