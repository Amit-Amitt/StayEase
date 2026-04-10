import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sampleBookings } from '@/constants/mockData';

export const useBookingStore = create(
  persist(
    (set) => ({
  draft: {
    hotel: null,
    roomTypeId: '',
    search: {
      location: '',
      checkIn: null,
      checkOut: null,
      guests: 2,
    },
    guest: null,
  },
  bookings: sampleBookings,
  setDraftBooking: (payload) =>
    set((state) => ({
      draft: {
        ...state.draft,
        ...payload,
      },
    })),
  addBooking: (booking) =>
    set((state) => ({
      bookings: [booking, ...state.bookings],
    })),
  resetDraft: () =>
    set({
      draft: {
        hotel: null,
        roomTypeId: '',
        search: {
          location: '',
          checkIn: null,
          checkOut: null,
          guests: 2,
        },
        guest: null,
      },
    }),
  }),
  {
    name: 'stayease-booking-storage',
  }
));
