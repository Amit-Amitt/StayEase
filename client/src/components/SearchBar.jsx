import { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DatePickerField } from '@/components/DatePickerField';
import { Input } from '@/components/ui/Input';
import { useSearchStore } from '@/store/useSearchStore';

const toIsoDate = (value) => (value ? value.toISOString().split('T')[0] : null);

export const SearchBar = ({ compact = false }) => {
  const navigate = useNavigate();
  const { searchParams, setSearchParams } = useSearchStore();
  const [location, setLocation] = useState(searchParams.location);
  const [guests, setGuests] = useState(searchParams.guests);
  const [checkIn, setCheckIn] = useState(searchParams.checkIn ? new Date(searchParams.checkIn) : null);
  const [checkOut, setCheckOut] = useState(
    searchParams.checkOut ? new Date(searchParams.checkOut) : null,
  );

  const onSubmit = (event) => {
    event.preventDefault();
    setSearchParams({
      location,
      guests,
      checkIn: toIsoDate(checkIn),
      checkOut: toIsoDate(checkOut),
    });
    navigate('/search');
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`grid gap-3 rounded-[28px] border border-white/60 bg-white/85 p-4 shadow-soft backdrop-blur ${
        compact ? 'md:grid-cols-[1.2fr,1fr,1fr,0.7fr,auto]' : 'lg:grid-cols-[1.4fr,1fr,1fr,0.7fr,auto]'
      }`}
    >
      <Input placeholder="Where are you going?" value={location} onChange={(e) => setLocation(e.target.value)} />
      <DatePickerField selected={checkIn} onChange={setCheckIn} placeholderText="Check-in date" />
      <DatePickerField
        selected={checkOut}
        onChange={setCheckOut}
        minDate={checkIn ?? undefined}
        placeholderText="Check-out date"
      />
      <Input
        type="number"
        min={1}
        max={8}
        placeholder="Guests"
        value={guests}
        onChange={(e) => setGuests(Number(e.target.value))}
      />
      <Button type="submit" className="h-12 gap-2">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
};
