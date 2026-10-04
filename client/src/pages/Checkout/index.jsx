import { useNavigate } from 'react-router-dom';
import { BookingSummary } from '@/components/BookingSummary';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/context/useAuth';
import { PaymentMethods } from '@/booking/components/PaymentMethods';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { draft } = useBookingStore();
  
  const hotel = draft.hotel;
  const room = hotel?.roomTypes.find((item) => item.id === draft.roomTypeId) ?? hotel?.roomTypes[0];
  const guest = draft.guest;
  
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

  return (
    <>
      <Seo title="Checkout | StayEase" description="Confirm payment details and finish your hotel reservation." />
      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <Card className="p-6">
          <h1 className="text-3xl font-bold">Secure checkout</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Choose Razorpay or PayPal to pay securely. Payment details are entered directly with your payment provider and are not stored by StayEase.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-muted/50 p-4 text-sm">
            <p className="font-semibold">{guest.fullName}</p>
            <p className="mt-1 text-muted-foreground">{guest.email}</p>
          </div>
          <PaymentMethods payload={{
            hotelId: hotel.id || hotel._id,
            roomTypeId: room.id,
            checkIn: draft.search.checkIn ?? '',
            checkOut: draft.search.checkOut ?? '',
            guests: draft.search.guests,
            fullName: guest.fullName,
            email: guest.email,
            phone: guest.phone,
            specialRequests: guest.specialRequests,
          }} />
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
