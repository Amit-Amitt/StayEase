import { MapPin, Sparkles, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/RatingStars';
import { PriceTag } from '@/components/PriceTag';
import { useUserProfile, useToggleSaveHotel } from '@/hooks/useUser';
import { useAuth } from '@/context/AuthContext';

export const HotelCard = ({ hotel }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useUserProfile();
  const { mutate: toggleSave } = useToggleSaveHotel();
  
  const hotelId = hotel.id || hotel._id;
  const isSaved = profile?.savedHotels?.includes(hotelId);

  const handleSave = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to save hotels.');
      navigate('/login');
      return;
    }
    toggleSave(hotelId);
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[280px,1fr]">
        <div className="relative h-full min-h-[240px] w-full">
          <img src={hotel.images[0]} alt={hotel.name} className="h-full w-full object-cover" />
          <button
            onClick={handleSave}
            title={isSaved ? "Remove from saved" : "Save hotel"}
            className="absolute right-4 top-4 flex p-2 bg-white border border-white/20 rounded-full hover:scale-110 transition shadow-sm"
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
          </button>
        </div>
        <div className="flex flex-col justify-between p-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">{hotel.name}</h3>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {hotel.location}
                </div>
              </div>
              <RatingStars rating={hotel.rating} stars={hotel.stars} />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{hotel.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {hotel.amenities.slice(0, 4).map((amenity) => (
                <span key={amenity} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-4 w-4" />
                Top pick
              </div>
              <PriceTag value={hotel.pricePerNight} />
            </div>
            <Link
              to={`/hotel/${hotelId}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};
