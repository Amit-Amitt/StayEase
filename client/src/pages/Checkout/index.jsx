import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useCreateBooking } from '@/hooks/useHotels';
import { BookingSummary } from '@/components/BookingSummary';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/context/useAuth';

const paymentSchema = z.object({
  cardName: z.string().min(2, 'Name on card is required'),
  cardNumber: z.string().min(16, 'Enter a valid card number'),
  expiry: z.string().min(4, 'Expiry is required'),
  cvc: z.string().min(3, 'CVC is required'),
  promoCode: z.string().optional(),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { draft, addBooking, resetDraft } = useBookingStore();
  const { mutate: createBooking, isPending } = useCreateBooking();
  
  const hotel = draft.hotel;
  const room = hotel?.roomTypes.find((item) => item.id === draft.roomTypeId) ?? hotel?.roomTypes[0];
  const guest = draft.guest;
  
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardName: guest?.fullName ?? '',
      cardNumber: '',
      expiry: '',
      cvc: '',
      promoCode: '',
    },
  });

  const { user } = useAuth();
  if (!user) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-bold">Login required</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please log in to complete your purchase.</p>
        <Button className="mt-5" onClick={() => navigate('/login')}>Login</Button>
      </Card>
    );
  }

  if (!hotel || !room || !guest) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-bold">Checkout details missing</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please complete the booking form before checkout.</p>
      </Card>
    );
  }

  const onSubmit = () => {
    createBooking(
      {
        hotelId: hotel.id,
        roomTypeId: room.id,
        checkIn: draft.search.checkIn ?? '',
        checkOut: draft.search.checkOut ?? '',
        guests: draft.search.guests,
        fullName: guest.fullName,
        email: guest.email,
        phone: guest.phone,
        specialRequests: guest.specialRequests,
      },
      {
        onSuccess: (data) => {
          addBooking(data);
          resetDraft();
          toast.success('Booking confirmed');
          navigate('/profile');
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || 'Failed to complete booking');
        },
      }
    );
  };

  return (
    <>
      <Seo title="Checkout | StayEase" description="Confirm payment details and finish your hotel reservation." />
      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <Card className="p-6">
          <h1 className="text-3xl font-bold">Secure checkout</h1>
          <p className="mt-3 text-sm text-muted-foreground">Your payment details are ready for backend gateway integration later.</p>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {[
              { name: 'cardName', label: 'Name on card' },
              { name: 'cardNumber', label: 'Card number' },
              { name: 'expiry', label: 'Expiry date' },
              { name: 'cvc', label: 'CVC' },
              { name: 'promoCode', label: 'Promo code' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="mb-2 block text-sm font-medium">{label}</label>
                <input
                  {...form.register(name)}
                  className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                />
                <p className="mt-1 text-xs text-rose-500">{form.formState.errors[name]?.message}</p>
              </div>
            ))}
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Processing...' : 'Pay & confirm'}
            </Button>
          </form>
        </Card>

        <BookingSummary
          hotel={hotel}
          roomName={room.name}
          checkIn={draft.search.checkIn}
          checkOut={draft.search.checkOut}
          guests={draft.search.guests}
          basePrice={room.price}
        />
      </div>
    </>
  );
}
