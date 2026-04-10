import { useState } from 'react';
import { useHotels, useCreateHotel, useUpdateHotel, useDeleteHotel } from '@/hooks/useHotels';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Seo } from '@/components/Seo';

export default function AdminDashboard() {
  const { data: hotels, isLoading, isError } = useHotels();
  const createHotel = useCreateHotel();
  const updateHotel = useUpdateHotel();
  const deleteHotel = useDeleteHotel();

  const [formData, setFormData] = useState({ name: '', location: '', pricePerNight: '', description: '', image: '', featured: false });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      location: formData.location,
      pricePerNight: Number(formData.pricePerNight),
      description: formData.description,
      images: [formData.image],
      city: formData.location.split(',')[0] || formData.location,
      featured: formData.featured
    };
    
    if (editingId) {
      updateHotel.mutate({ id: editingId, ...payload }, {
        onSuccess: () => resetForm()
      });
    } else {
      createHotel.mutate(payload, {
        onSuccess: () => resetForm()
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', location: '', pricePerNight: '', description: '', image: '', featured: false });
    setEditingId(null);
  };

  const handleEdit = (hotel) => {
    setFormData({
      name: hotel.name,
      location: hotel.location,
      pricePerNight: hotel.pricePerNight,
      description: hotel.description || '',
      image: hotel.images?.[0] || '',
      featured: hotel.featured || false
    });
    setEditingId(hotel.id || hotel._id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this hotel?')) {
      deleteHotel.mutate(id);
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading hotels</div>;

  return (
    <>
      <Seo title="Admin Dashboard | StayEase" description="Manage hotels" />
      <div className="container mx-auto py-12 px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Card className="p-6 mb-12">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Hotel' : 'Add New Hotel'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price Per Night</label>
                <Input required type="number" min="1" value={formData.pricePerNight} onChange={e => setFormData({ ...formData, pricePerNight: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <Input required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                required
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="featured" 
                checked={formData.featured}
                onChange={e => setFormData({ ...formData, featured: e.target.checked })} 
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="featured" className="text-sm font-medium">Show on Home Page (Featured)</label>
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={createHotel.isPending || updateHotel.isPending}>
                {editingId ? 'Update Hotel' : 'Add Hotel'}
              </Button>
              {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
            </div>
          </form>
        </Card>

        <h2 className="text-xl font-semibold mb-4">Manage Hotels</h2>
        <div className="grid gap-4">
          {hotels?.map(hotel => (
            <Card key={hotel._id || hotel.id} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{hotel.name}</h3>
                <p className="text-sm text-gray-500">{hotel.location} • ${hotel.pricePerNight}/night</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(hotel)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(hotel.id || hotel._id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
