import { cn } from '@/utils/cn';

export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-2xl bg-muted', className)} />
);
