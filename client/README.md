# StayEase Frontend

Production-ready hotel booking platform frontend built with React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, Zustand, Axios, and Zod.

## Install

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

## Routes

- `/` Home page
- `/search` Search results
- `/hotel/:id` Hotel details
- `/booking/:hotelId` Booking flow
- `/checkout` Checkout
- `/profile` User profile

## Architecture

```text
src/
  api/
  assets/
  booking/
  components/
  constants/
  hooks/
  hotel/
  layouts/
  pages/
  routes/
  store/
  types/
  utils/
```

## Mock Data

Example hotels and a sample booking live in [src/constants/mockData.ts](/home/amit/Desktop/Hotel-booking/src/constants/mockData.ts).

## Backend Integration Notes

- Replace functions in [src/api/hotelApi.ts](/home/amit/Desktop/Hotel-booking/src/api/hotelApi.ts) with real endpoints.
- Keep TanStack Query hooks in [src/hooks/useHotels.ts](/home/amit/Desktop/Hotel-booking/src/hooks/useHotels.ts) as the frontend boundary.
- Zustand stores in [src/store/useSearchStore.ts](/home/amit/Desktop/Hotel-booking/src/store/useSearchStore.ts), [src/store/useBookingStore.ts](/home/amit/Desktop/Hotel-booking/src/store/useBookingStore.ts), and [src/store/useAppStore.ts](/home/amit/Desktop/Hotel-booking/src/store/useAppStore.ts) are ready to be hydrated from API responses later.
