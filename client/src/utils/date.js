export const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const diff = end - start;

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
};

export const formatDate = (value) => {
  if (!value) return 'Flexible';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
