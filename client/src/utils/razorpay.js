import { verifyBookingPayment } from '@/api/hotelApi';

const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-script';
let scriptPromise;

export const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(RAZORPAY_SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = RAZORPAY_SCRIPT_ID;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
    }

    const handleLoad = () => {
      if (window.Razorpay) resolve();
      else {
        script.remove();
        reject(new Error('Razorpay Checkout did not load. Please try again.'));
      }
    };
    const handleError = () => {
      script.remove();
      reject(new Error('Unable to load Razorpay Checkout. Check your connection and try again.'));
    };
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!script.isConnected) document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = undefined;
    throw error;
  });

  return scriptPromise;
};

export const openRazorpayCheckout = ({ checkoutData, user, onPaymentFailed }) => new Promise((resolve, reject) => {
  let settled = false;
  let paymentHandlerStarted = false;
  const finish = (callback, value) => {
    if (settled) return;
    settled = true;
    callback(value);
  };
  const { booking, keyId, order } = checkoutData;
  const checkout = new window.Razorpay({
    key: keyId,
    amount: order.amount,
    currency: order.currency,
    name: 'StayEase',
    description: `Reservation at ${booking.hotelName}`,
    order_id: order.id,
    prefill: {
      name: booking.fullName || user.name,
      email: booking.email || user.email,
      contact: booking.phone === 'Not Provided' ? undefined : booking.phone,
    },
    notes: { bookingId: booking._id },
    theme: { color: '#0f766e' },
    modal: {
      ondismiss: () => {
        if (paymentHandlerStarted) return;
        const error = new Error('Payment was cancelled. Your booking is still pending payment.');
        error.code = 'RAZORPAY_DISMISSED';
        finish(reject, error);
      },
    },
    handler: async (paymentResponse) => {
      paymentHandlerStarted = true;
      try {
        const result = await verifyBookingPayment({
          bookingId: booking._id,
          ...paymentResponse,
        });
        finish(resolve, result.booking);
      } catch (error) {
        finish(reject, error);
      }
    },
  });

  checkout.on('payment.failed', (response) => {
    onPaymentFailed?.(response.error?.description || 'Payment failed. You can try another payment method.');
  });
  checkout.open();
});
