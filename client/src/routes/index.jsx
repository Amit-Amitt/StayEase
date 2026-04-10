import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader } from '@/components/ui/Loader';
import { MainLayout } from '@/layouts/MainLayout';

const HomePage = lazy(() => import('@/pages/Home'));
const SearchResultsPage = lazy(() => import('@/pages/SearchResults'));
const HotelDetailsPage = lazy(() => import('@/pages/HotelDetails'));
const BookingPage = lazy(() => import('@/pages/Booking'));
const CheckoutPage = lazy(() => import('@/pages/Checkout'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboard/index'));
import { AdminRoute } from '@/components/AdminRoute';

const withSuspense = (element) => <Suspense fallback={<Loader />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <MainLayout />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'search', element: withSuspense(<SearchResultsPage />) },
      { path: 'hotel/:id', element: withSuspense(<HotelDetailsPage />) },
      { path: 'booking/:hotelId', element: withSuspense(<BookingPage />) },
      { path: 'checkout', element: withSuspense(<CheckoutPage />) },
      { path: 'profile', element: withSuspense(<ProfilePage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      { path: 'register', element: withSuspense(<RegisterPage />) },
      { path: 'admin', element: <AdminRoute>{withSuspense(<AdminDashboardPage />)}</AdminRoute> },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
