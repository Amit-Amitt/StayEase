export const HotelGallery = ({ hotel }) => (
  <div className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
    <img src={hotel.images[0]} alt={hotel.name} className="h-[420px] w-full rounded-[32px] object-cover" />
    <div className="grid gap-4">
      {hotel.images.slice(1).map((image) => (
        <img key={image} src={image} alt={hotel.name} className="h-[202px] w-full rounded-[32px] object-cover" />
      ))}
    </div>
  </div>
);
