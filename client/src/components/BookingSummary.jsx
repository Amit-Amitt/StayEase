import { formatCurrency } from '@/utils/currency';
import { formatDate, nightsBetween } from '@/utils/date';
import { Card } from '@/components/ui/Card';

export const BookingSummary = ({ hotel, roomName, checkIn, checkOut, guests, basePrice }) => {
  const nights = Math.max(nightsBetween(checkIn, checkOut), 1);
  const subtotal = basePrice * nights;
  const fees = Math.round(subtotal * 0.12);
  const total = subtotal + fees;

  return (
    <Card className="p-5">
      <div className="flex gap-4">
        <img src={hotel.images[0]} alt={hotel.name} className="h-20 w-24 rounded-2xl object-cover" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Booking summary</p>
          <h3 className="mt-2 text-lg font-bold">{hotel.name}</h3>
          <p className="text-sm text-muted-foreground">{roomName}</p>
        </div>
      </div>
      <div className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dates</span>
          <span>{formatDate(checkIn)} - {formatDate(checkOut)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Guests</span>
          <span>{guests}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{formatCurrency(basePrice)} x {nights} nights</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxes & fees</span>
          <span>{formatCurrency(fees)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </Card>
  );
};
