import { useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { HotelCard } from '@/components/HotelCard';
import { SearchBar } from '@/components/SearchBar';
import { Seo } from '@/components/Seo';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSearchHotels } from '@/hooks/useHotels';
import { useSearchStore } from '@/store/useSearchStore';

const amenityOptions = ['Pool', 'Spa', 'WiFi', 'Breakfast', 'Gym', 'Beachfront', 'Parking', 'Workspace'];

export default function SearchResultsPage() {
  const { searchParams, filters, updateFilters, resetFilters } = useSearchStore();
  const { data, isLoading } = useSearchHotels(searchParams, filters);

  const emptyState = useMemo(() => !isLoading && data?.length === 0, [data, isLoading]);

  return (
    <>
      <Seo title="Search stays | StayEase" description="Browse available hotels with flexible filters and modern booking tools." />
      <div className="space-y-8">
        <SearchBar compact />
        <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
          <Card className="h-fit p-6">
            <div className="flex items-center justify-between">
              <h1 className="flex items-center gap-2 text-lg font-bold"><SlidersHorizontal className="h-4 w-4" /> Filters</h1>
              <button onClick={resetFilters} className="text-sm font-semibold text-primary">Reset</button>
            </div>
            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Price range</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" value={filters.minPrice} onChange={(e) => updateFilters({ minPrice: Number(e.target.value) })} />
                  <Input type="number" value={filters.maxPrice} onChange={(e) => updateFilters({ maxPrice: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium">Star rating</p>
                <div className="flex flex-wrap gap-2">
                  {[3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        updateFilters({
                          stars: filters.stars.includes(star)
                            ? filters.stars.filter((item) => item !== star)
                            : [...filters.stars, star],
                        })
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium ${filters.stars.includes(star) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                      {star} star
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium">Amenities</p>
                <div className="space-y-2">
                  {amenityOptions.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(amenity)}
                        onChange={() =>
                          updateFilters({
                            amenities: filters.amenities.includes(amenity)
                              ? filters.amenities.filter((item) => item !== amenity)
                              : [...filters.amenities, amenity],
                          })
                        }
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Sort by</label>
                <select
                  className="h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value })}
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: Low to high</option>
                  <option value="price-desc">Price: High to low</option>
                  <option value="rating">Top rated</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">
                {data?.length ?? 0} stays found for {searchParams.location || 'all destinations'}
              </p>
              <h2 className="mt-1 text-3xl font-bold">Search results</h2>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-48 animate-pulse rounded-[28px] bg-muted" />
                <div className="h-48 animate-pulse rounded-[28px] bg-muted" />
              </div>
            ) : null}
            {emptyState ? (
              <Card className="p-10 text-center">
                <h3 className="text-2xl font-bold">No stays match these filters</h3>
                <p className="mt-3 text-sm text-muted-foreground">Try widening your price range or removing a few amenities.</p>
              </Card>
            ) : null}
            {data?.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
          </div>
        </div>
      </div>
    </>
  );
}
