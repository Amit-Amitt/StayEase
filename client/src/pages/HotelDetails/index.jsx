import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Heart } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/DatePickerField';
import { PriceTag } from '@/components/PriceTag';
import { RatingStars } from '@/components/RatingStars';
import { useHotelDetails } from '@/hooks/useHotels';
import { HotelAmenities } from '@/hotel/components/HotelAmenities';
import { HotelGallery } from '@/hotel/components/HotelGallery';
import { useBookingStore } from '@/store/useBookingStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useAuth } from '@/context/useAuth';
import { useUserProfile, useToggleSaveHotel } from '@/hooks/useUser';

const toIsoDate = (value) => (value ? value.toISOString().split('T')[0] : null);

export default function HotelDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: hotel, isLoading } = useHotelDetails(id);
  const { searchParams } = useSearchStore();
  const { setDraftBooking } = useBookingStore();
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState('');
  const [checkIn, setCheckIn] = useState(searchParams.checkIn ? new Date(searchParams.checkIn) : null);
  const [checkOut, setCheckOut] = useState(searchParams.checkOut ? new Date(searchParams.checkOut) : null);
  const [guests, setGuests] = useState(searchParams.guests);

  const { data: profile } = useUserProfile();
  const { mutate: toggleSave } = useToggleSaveHotel();
  const hotelId = hotel?.id || hotel?._id;
  const isSaved = profile?.savedHotels?.includes(hotelId);

  if (isLoading || !hotel) return <Loader />;

  const handleSave = () => {
    if (!user) {
      toast.error('Please login to save hotels.');
      navigate('/login');
      return;
    }
    toggleSave(hotelId, {
      onSuccess: () => {
        toast.success(isSaved ? 'Removed from saved hotels' : 'Hotel saved!');
      }
    });
  };

  const selectedRoomType = hotel.roomTypes.find((room) => room.id === selectedRoom) ?? hotel.roomTypes[0];

  const bookNow = () => {
    if (!user) {
      toast.error('Please login to book a stay.');
      navigate('/login');
      return;
    }
    
    if (!checkIn || !checkOut) {
      toast.error('Please select both check-in and check-out dates.');
      return;
    }

    setDraftBooking({
      hotel,
      roomTypeId: selectedRoomType?.id || 'standard',
      search: {
        location: hotel.city,
        checkIn: toIsoDate(checkIn),
        checkOut: toIsoDate(checkOut),
        guests,
      },
    });
    toast.success('Review your booking...');
    const pathId = hotel.id || hotel._id;
    navigate(`/booking/${pathId}`);
  };

  return (
    <>
      <Seo title={`${hotel.name} | StayEase`} description={hotel.description} />
      <div className="space-y-8">
        <HotelGallery hotel={hotel} />

        <div className="grid gap-8 lg:grid-cols-[1fr,360px]">
          <div className="space-y-8">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-bold">{hotel.name}</h1>
                    <button onClick={handleSave} className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition hover:bg-muted/80">
                      <Heart className={`h-6 w-6 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {hotel.location}
                  </div>
                </div>
                <PriceTag value={hotel.pricePerNight} />
              </div>
              <div className="mt-4">
                <RatingStars rating={hotel.rating} stars={hotel.stars} />
              </div>
              <p className="mt-6 max-w-3xl leading-7 text-muted-foreground">{hotel.longDescription}</p>
            </div>

            <HotelAmenities hotel={hotel} />

            <Card className="p-6">
              <h2 className="text-2xl font-bold">Room types</h2>
              <div className="mt-5 space-y-4">
                {hotel.roomTypes.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`w-full rounded-[24px] border p-4 text-left transition ${selectedRoomType.id === room.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{room.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{room.beds} • Up to {room.capacity} guests</p>
                      </div>
                      <span className="text-lg font-bold">${room.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Reviews</h2>
                <span className="text-sm text-muted-foreground">{hotel.reviewsCount} verified reviews</span>
              </div>
              <div className="mt-5 space-y-4">
                {hotel.reviews.map((review) => (
                  <div key={review.id} className="rounded-[24px] bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{review.user}</p>
                      <p className="text-sm text-muted-foreground">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="sticky top-24 h-fit p-6">
            <h2 className="text-2xl font-bold">Reserve your stay</h2>
            <div className="mt-5 space-y-4">
              <DatePickerField selected={checkIn} onChange={setCheckIn} placeholderText="Check-in date" />
              <DatePickerField selected={checkOut} onChange={setCheckOut} placeholderText="Check-out date" minDate={checkIn ?? undefined} />
              <input
                type="number"
                min={1}
                max={8}
                className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
              <Button className="w-full" onClick={bookNow}>Book now</Button>
              <Link to="/search" className="block text-center text-sm font-semibold text-primary">
                Continue browsing
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
