import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { BookingSummary } from '@/components/BookingSummary';
import { Seo } from '@/components/Seo';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/useAuth';
import { useBookingStore } from '@/store/useBookingStore';
import { PaymentMethods } from '@/booking/components/PaymentMethods';

export default function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hotelId = '' } = useParams();
  const { draft, resetDraft } = useBookingStore();
  const hotel = draft.hotel;
  
  const room = hotel 
    ? (hotel.roomTypes?.length > 0
        ? (hotel.roomTypes.find((item) => item.id === draft.roomTypeId) ?? hotel.roomTypes[0])
        : { id: 'standard', name: 'Standard Room', price: hotel.pricePerNight || 1999, beds: '1 Queen', capacity: 2 })
    : null;

  const currentHotelId = hotel?.id || hotel?._id;
  if (!user) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-bold">Login required</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please log in to continue booking.</p>
        <Button className="mt-5" onClick={() => navigate('/login')}>Login</Button>
      </Card>
    );
  }

  if (!hotel || currentHotelId !== hotelId || !room) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-2xl font-bold">No booking draft found</h1>
        <p className="mt-3 text-sm text-muted-foreground">Choose a hotel first to continue your booking.</p>
      </Card>
    );
  }

  const handleCancel = () => {
    resetDraft();
    navigate('/');
  };

  return (
    <>
      <Seo title="Review Booking | StayEase" description="Review details and confirm your stay." />
      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        <Card className="p-6">
          <h1 className="text-3xl font-bold">Review and confirm</h1>
          <p className="mt-3 text-sm text-muted-foreground">Please review your booking details. Your profile details will be used for the reservation.</p>
          
          <div className="mt-8 rounded-[24px] bg-primary/5 p-6">
            <h3 className="font-bold text-primary">Guest Information</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="font-semibold">Name:</span> {user.name || 'Guest User'}</p>
              <p><span className="font-semibold">Email:</span> {user.email}</p>
            </div>
          </div>
          
          <div className="mt-8">
            <Button type="button" variant="secondary" className="w-full" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
          <PaymentMethods payload={{
            hotelId: hotel.id || hotel._id,
            roomTypeId: room.id,
            checkIn: draft.search.checkIn ?? '',
            checkOut: draft.search.checkOut ?? '',
            guests: draft.search.guests,
            fullName: user.name || 'Guest User',
            email: user.email,
            phone: 'Not Provided',
            specialRequests: '',
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
