import { Card } from '@/components/ui/Card';

export const HotelAmenities = ({ hotel }) => (
  <Card className="p-6">
    <h2 className="text-2xl font-bold">Amenities</h2>
    <div className="mt-5 flex flex-wrap gap-3">
      {hotel.amenities.map((amenity) => (
        <span key={amenity} className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
          {amenity}
        </span>
      ))}
    </div>
  </Card>
);
