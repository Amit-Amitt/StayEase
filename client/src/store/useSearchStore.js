import { create } from 'zustand';

const defaultSearch = {
  location: '',
  checkIn: null,
  checkOut: null,
  guests: 2,
};

const defaultFilters = {
  minPrice: 0,
  maxPrice: 5000,
  stars: [],
  amenities: [],
  sortBy: 'recommended',
};

export const useSearchStore = create((set) => ({
  searchParams: defaultSearch,
  filters: defaultFilters,
  setSearchParams: (searchParams) => set({ searchParams }),
  updateFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
