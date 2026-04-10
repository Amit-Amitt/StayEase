import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Heart, Settings, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/useAuth';
import { useUserBookings } from '@/hooks/useHotels';
import { useBookingStore } from '@/store/useBookingStore';
import { formatCurrency } from '@/utils/currency';
import { useUserProfile, useUpdateProfile } from '@/hooks/useUser';
import { HotelCard } from '@/components/HotelCard';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('trips');

  const { data: apiBookings, isLoading: loadingBookings } = useUserBookings();
  const { bookings: storeBookings } = useBookingStore();
  const bookings = (apiBookings && apiBookings.length > 0) ? apiBookings : storeBookings;

  const { data: profile, isLoading: loadingProfile } = useUserProfile();
  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();

  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || 'G';
  const userDisplayName = user?.name || 'Guest traveler';

  const form = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' }
  });

  useEffect(() => {
     if (profile) {
         form.reset({ name: profile.name, email: profile.email });
     }
  }, [profile, form]);

  const onUpdateProfile = (val) => {
    updateProfile(val, {
      onSuccess: () => toast.success("Profile updated seamlessly!"),
      onError: (err) => toast.error(err.response?.data?.message || "Failed to update profile")
    });
  };

  return (
    <>
      <Seo title="Profile | StayEase" description="Manage bookings, saved stays, and account preferences." />
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <Card className="h-fit p-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-center text-2xl font-bold leading-[64px] text-primary">
            {userInitial.toUpperCase()}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{userDisplayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email || 'Sign in to access traveler features.'}</p>
          {user ? (
            <>
              <div className="mt-6 flex flex-col gap-2 text-sm font-medium">
                <button 
                  onClick={() => setActiveTab('trips')}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 transition ${activeTab === 'trips' ? 'bg-primary/10 text-primary' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}>
                  <Briefcase className="h-4 w-4" /> Upcoming trips
                </button>
                <button 
                  onClick={() => setActiveTab('saved')}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 transition ${activeTab === 'saved' ? 'bg-primary/10 text-primary' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}>
                  <Heart className="h-4 w-4" /> Saved hotels
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 transition ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}>
                  <Settings className="h-4 w-4" /> Account settings
                </button>
              </div>
              <Button type="button" variant="secondary" className="mt-6 w-full justify-center" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Sign in to sync your bookings and unlock profile settings.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition duration-200 hover:opacity-90">
                  Login
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition duration-200 hover:bg-muted">
                  Register
                </Link>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {activeTab === 'trips' && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold">Your bookings</h2>
              <div className="mt-5 space-y-4">
                {loadingBookings && user ? (
                  <div className="flex h-32 items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /><span>Loading your bookings...</span>
                  </div>
                ) : bookings.length > 0 ? (
                  <>
                    {bookings.map((booking) => (
                      <div key={booking._id || booking.id} className="rounded-[24px] bg-muted p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{booking.hotelName}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {booking.checkIn} to {booking.checkOut} • {booking.guests} guests
                            </p>
                            <p className="mt-1 text-xs italic text-muted-foreground">Room ID: {booking.roomTypeId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(booking.total)}</p>
                            <p className={`text-sm font-semibold ${booking.status === 'Cancelled' ? 'text-rose-500' : 'text-primary'}`}>
                              {booking.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      {user ? "You haven't made any bookings yet." : "No bookings found."}
                    </p>
                    <Link to="/search" className="mt-3 inline-block text-sm font-bold text-primary">Explore hotels</Link>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'saved' && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold">Saved hotels</h2>
              {loadingProfile ? (
                 <div className="flex h-32 items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /><span>Loading wishlist...</span>
                 </div>
              ) : profile?.savedHotelsData?.length > 0 ? (
                 <div className="mt-5 grid gap-6 sm:grid-cols-2">
                   {profile.savedHotelsData.map(hotel => (
                      <HotelCard key={hotel.id || hotel._id} hotel={hotel} />
                   ))}
                 </div>
              ) : (
                 <div className="mt-5 rounded-[24px] border border-dashed border-border p-8 text-center">
                    <Heart className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">You haven't saved any hotels yet.</p>
                 </div>
              )}
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="max-w-xl p-6">
              <h2 className="text-2xl font-bold">Account settings</h2>
              <form onSubmit={form.handleSubmit(onUpdateProfile)} className="mt-6 space-y-5">
                 <div>
                   <label className="mb-2 block text-sm font-medium">Full Name</label>
                   <input {...form.register('name', { required: true })} className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm" />
                 </div>
                 <div>
                   <label className="mb-2 block text-sm font-medium">Email Address</label>
                   <input type="email" {...form.register('email', { required: true })} className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm" />
                 </div>
                 <Button type="submit" disabled={updating}>{updating ? "Saving..." : "Save changes"}</Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
