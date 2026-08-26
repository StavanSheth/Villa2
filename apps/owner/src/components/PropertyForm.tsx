'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Image as ImageIcon, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PropertyFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export function PropertyForm({ initialData, isEdit = false }: PropertyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    basePrice: initialData?.basePrice?.toString() || '10000',
    capacity: initialData?.capacity?.toString() || '4',
    bedrooms: initialData?.bedrooms?.toString() || '2',
    bathrooms: initialData?.bathrooms?.toString() || '2',
    isActive: initialData?.isActive ?? true,
    images: Array.isArray(initialData?.images) ? initialData.images.join(', ') : '',
    amenities: Array.isArray(initialData?.amenities) ? initialData.amenities.join(', ') : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        images: formData.images.split(',').map((s: string) => s.trim()).filter(Boolean),
        amenities: formData.amenities.split(',').map((s: string) => s.trim()).filter(Boolean),
      };

      const url = isEdit ? `/api/properties/${initialData.id}` : '/api/properties';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save property details.');
      }

      router.push('/properties');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in text-white">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/properties" className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-serif text-primary">{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
          <p className="text-white/60 mt-1">Fill out the details below to sync with the booking platform.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Property Name</label>
              <input 
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="e.g. Seven C Villa"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
              <textarea 
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="A detailed description of your property..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Base Nightly Rate (₹)</label>
              <input 
                required
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Max Capacity (Guests)</label>
              <input 
                required
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Bedrooms</label>
              <input 
                required
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Bathrooms</label>
              <input 
                required
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">Amenities (Comma separated)</label>
              <input 
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="WiFi, Private Pool, AC, BBQ..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                <ImageIcon size={16} /> Image URLs (Comma separated)
              </label>
              <input 
                name="images"
                value={formData.images}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
              <p className="text-xs text-white/40 mt-2">Provide direct links to your property images to display them in the catalog.</p>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <input 
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                id="isActive"
                className="w-5 h-5 accent-[#D4AF37]"
              />
              <label htmlFor="isActive" className="font-medium">Property is Active and Bookable</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isEdit ? 'Save Changes' : 'Create Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
