import { Star } from 'lucide-react';

export const RatingStars = ({ rating, stars }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: stars ?? Math.round(rating ?? 0) }).map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-current" />
      ))}
    </div>
    {rating ? <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span> : null}
  </div>
);
