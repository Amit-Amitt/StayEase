import DatePicker from 'react-datepicker';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/utils/cn';

export const DatePickerField = ({ className, ...props }) => (
  <div
    className={cn(
      'flex h-12 items-center gap-3 rounded-2xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
      className,
    )}
  >
    <CalendarDays className="h-4 w-4 text-muted-foreground" />
    <DatePicker
      dateFormat="MMM d, yyyy"
      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      {...props}
    />
  </div>
);
