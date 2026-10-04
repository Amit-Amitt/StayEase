import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { capturePaypalBooking } from '@/api/hotelApi';
import { useCreateBooking } from '@/hooks/useHotels';
import { useAuth } from '@/context/useAuth';
import { useBookingStore } from '@/store/useBookingStore';
import { loadRazorpayCheckout, openRazorpayCheckout } from '@/utils/razorpay';

export const usePaymentBooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBooking, resetDraft } = useBookingStore();
  const { mutateAsync: createBooking } = useCreateBooking();
  const [activePaymentMethod, setActivePaymentMethod] = useState(null);
  const paypalBookingId = useRef(null);
  const paypalRequestInProgress = useRef(false);

  const finishBooking = (booking) => {
    addBooking(booking);
    resetDraft();
    toast.success('Payment successful. Your booking is confirmed.');
    navigate('/profile');
  };

  const payWithRazorpay = async (payload) => {
    setActivePaymentMethod('RAZORPAY');
    try {
      await loadRazorpayCheckout();
      const checkoutData = await createBooking({ ...payload, paymentProvider: 'RAZORPAY' });
      const booking = await openRazorpayCheckout({
        checkoutData,
        user,
        onPaymentFailed: (message) => toast.error(message),
      });
      finishBooking(booking);
      return true;
    } catch (error) {
      if (error.code === 'RAZORPAY_DISMISSED') {
        toast.error(error.message);
      } else {
        toast.error(error.response?.data?.message || error.message || 'Unable to complete your payment. Please try again.');
      }
      return false;
    } finally {
      setActivePaymentMethod(null);
    }
  };

  const createPayPalOrder = async (payload) => {
    if (paypalRequestInProgress.current) throw new Error('PayPal checkout is already in progress.');
    paypalRequestInProgress.current = true;
    setActivePaymentMethod('PAYPAL');
    try {
      let checkoutData;
      try {
        checkoutData = await createBooking({ ...payload, paymentProvider: 'PAYPAL' });
      } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Unable to start PayPal checkout.');
      }
      paypalBookingId.current = checkoutData.booking?._id;
      if (!checkoutData.order?.id || !paypalBookingId.current) {
        throw new Error('PayPal did not return a booking order. Please try again.');
      }
      return checkoutData.order.id;
    } finally {
      paypalRequestInProgress.current = false;
      setActivePaymentMethod(null);
    }
  };

  const capturePayPalOrder = async (paypalOrderId) => {
    if (paypalRequestInProgress.current) throw new Error('PayPal checkout is already in progress.');
    if (!paypalBookingId.current) throw new Error('Booking details are missing. Please restart checkout.');
    paypalRequestInProgress.current = true;
    setActivePaymentMethod('PAYPAL');
    try {
      let result;
      try {
        result = await capturePaypalBooking({
          bookingId: paypalBookingId.current,
          paypalOrderId,
        });
      } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Unable to verify PayPal payment.');
      }
      const { booking } = result;
      finishBooking(booking);
      paypalBookingId.current = null;
      return booking;
    } finally {
      paypalRequestInProgress.current = false;
      setActivePaymentMethod(null);
    }
  };

  return { payWithRazorpay, createPayPalOrder, capturePayPalOrder, activePaymentMethod };
};
