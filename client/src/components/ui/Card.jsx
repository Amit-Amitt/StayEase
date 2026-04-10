import { cn } from '@/utils/cn';

export const Card = ({ className, ...props }) => (
  <div className={cn('rounded-[28px] border border-border bg-card shadow-soft', className)} {...props} />
);
