import { formatCurrency } from '@/utils/currency';

export const PriceTag = ({ value }) => (
  <div className="flex items-end gap-1">
    <span className="text-2xl font-bold">{formatCurrency(value)}</span>
    <span className="pb-1 text-sm text-muted-foreground">/ night</span>
  </div>
);
