import { Link } from 'react-router-dom';
import { ArrowRight, Globe2, ShieldCheck, Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { HotelCard } from '@/components/HotelCard';
import { Seo } from '@/components/Seo';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { useFeaturedHotels } from '@/hooks/useHotels';

const destinations = ['Bali', 'Goa', 'Reykjavik', 'New York'];

export default function HomePage() {
  const { data: featuredHotels, isLoading } = useFeaturedHotels();

  return (
    <>
      <Seo title="StayEase | Find your next unforgettable stay" description="Search boutique hotels, luxury stays, and smart booking experiences." />
      <section className="overflow-hidden rounded-[40px] bg-hero-glow p-8 shadow-soft sm:p-10 lg:p-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div>
            <div className="inline-flex rounded-full bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-primary shadow-sm">
              Premium stays, simplified
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
              Discover exceptional hotels with a booking flow built for trust.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Explore curated destinations, compare amenities, and move from search to checkout in minutes.
            </p>
            <div className="mt-8">
              <SearchBar />
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Flexible booking policies</div>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Handpicked premium stays</div>
              <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-primary" /> Global destinations</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            ].map((image) => (
              <img key={image} src={image} alt="Luxury hotel" className="h-72 w-full rounded-[28px] object-cover" />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Featured hotels</p>
            <h2 className="mt-2 text-3xl font-bold">This week’s top stays</h2>
          </div>
          <Link to="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Explore all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6">
          {isLoading ? <Loader /> : featuredHotels?.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card className="p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Popular destinations</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {destinations.map((destination) => (
              <div key={destination} className="rounded-[24px] bg-muted p-4 text-center font-semibold">
                {destination}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Guest testimonials</p>
          <div className="mt-5 space-y-5">
            <blockquote className="rounded-[24px] bg-muted p-4 text-sm leading-6 text-muted-foreground">
              “The interface feels premium and the booking summary made checkout wonderfully clear.”
            </blockquote>
            <blockquote className="rounded-[24px] bg-muted p-4 text-sm leading-6 text-muted-foreground">
              “Fast, polished, and genuinely easier to browse than most travel platforms.”
            </blockquote>
          </div>
        </Card>
      </section>
    </>
  );
}
