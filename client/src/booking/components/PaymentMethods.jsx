import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { PayPalButton } from '@/booking/components/PayPalButton';
import { usePaymentBooking } from '@/hooks/usePaymentBooking';

export function PaymentMethods({ payload }) {
  const { payWithRazorpay, createPayPalOrder, capturePayPalOrder, activePaymentMethod } = usePaymentBooking();
  const isPaying = activePaymentMethod !== null;

  const handlePayPalError = (error) => {
    toast.error(error?.response?.data?.message || error?.message || 'Unable to complete PayPal payment. Please try again.');
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-base font-semibold">Choose a payment method</h2>
      <Button
        type="button"
        className="w-full justify-center"
        onClick={() => payWithRazorpay(payload)}
        disabled={isPaying}
      >
        {activePaymentMethod === 'RAZORPAY' ? 'Opening secure checkout...' : 'Pay with Razorpay'}
      </Button>
      <div className={isPaying ? 'pointer-events-none opacity-60' : ''}>
        <PayPalButton
          createOrder={() => createPayPalOrder(payload)}
          onApprove={capturePayPalOrder}
          onCancel={() => toast('PayPal checkout was cancelled.')}
          onError={handlePayPalError}
        />
      </div>
    </div>
  );
}
