import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CreateClubData } from '../services/clubService';

interface ClubRegistrationFormProps {
  onSubmit: (clubData: CreateClubData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData extends CreateClubData {
  honoursInput?: string; // For easier input handling
}

const ClubRegistrationForm: React.FC<ClubRegistrationFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [honours, setHonours] = useState<Array<{ name: string; count: number; years?: number[] }>>([]);
  const [currentHonour, setCurrentHonour] = useState({ name: '', count: 0, years: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FormData>();

  const uploadToCloudinary = async (file: File, uploadPreset: string): Promise<string> => {
    const url = `${import.meta.env.VITE_CLOUDINARY_URL || 'https://api.cloudinary.com/v1_1/dmuilu78u/auto/upload'}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Logo upload failed: ${res.status} ${errorText}`);
    }
    const data = await res.json();
    if (!data.secure_url) throw new Error('No secure_url returned from Cloudinary');
    return data.secure_url as string;
  };

  const addHonour = () => {
    if (currentHonour.name.trim() && currentHonour.count > 0) {
      const years = currentHonour.years
        ? currentHonour.years.split(',').map(y => parseInt(y.trim())).filter(y => !isNaN(y))
        : [];
      
      setHonours([...honours, {
        name: currentHonour.name.trim(),
        count: currentHonour.count,
        years: years.length > 0 ? years : undefined
      }]);
      
      setCurrentHonour({ name: '', count: 0, years: '' });
    }
  };

  const removeHonour = (index: number) => {
    setHonours(honours.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      // Require a logo image file if no URL provided in data
      if (!logoFile && !data.logo) {
        toast.error('Please upload a club logo image.');
        return;
      }

      let logoUrl = data.logo || '';
      if (logoFile) {
        // basic client-side validation
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(logoFile.type)) {
          toast.error('Invalid logo type. Please upload JPG, PNG or WEBP.');
          return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (logoFile.size > maxSize) {
          toast.error('Logo image too large. Max 5MB.');
          return;
        }
        logoUrl = await uploadToCloudinary(logoFile, 'ml_default');
      }

      // Clean optional fields: remove empty strings, coerce numbers
      const stadiumCapacity = (data.stadiumCapacity === undefined || data.stadiumCapacity === null || data.stadiumCapacity === ''
        ? undefined
        : Number(data.stadiumCapacity));

      const website = data.website && data.website.trim() !== '' ? data.website.trim() : undefined;
      const email = data.email && data.email.trim() !== '' ? data.email.trim() : undefined;
      const phone = data.phone && data.phone.trim() !== '' ? data.phone.trim() : undefined;

      const socialMedia = {
        twitter: data.socialMedia?.twitter && data.socialMedia.twitter.trim() !== '' ? data.socialMedia.twitter.trim() : undefined,
        facebook: data.socialMedia?.facebook && data.socialMedia.facebook.trim() !== '' ? data.socialMedia.facebook.trim() : undefined,
        instagram: data.socialMedia?.instagram && data.socialMedia.instagram.trim() !== '' ? data.socialMedia.instagram.trim() : undefined,
        youtube: data.socialMedia?.youtube && data.socialMedia.youtube.trim() !== '' ? data.socialMedia.youtube.trim() : undefined,
      };
      const hasSocial = !!(socialMedia.twitter || socialMedia.facebook || socialMedia.instagram || socialMedia.youtube);

      const clubData: CreateClubData = {
        name: data.name,
        logo: logoUrl,
        stadium: data.stadium,
        stadiumCapacity,
        founded: Number(data.founded),
        website,
        email,
        phone,
        city: data.city,
        country: data.country,
        honours: honours.length > 0 ? honours : undefined,
        description: data.description && data.description.trim() !== '' ? data.description.trim() : undefined,
        socialMedia: hasSocial ? socialMedia : undefined
      };

      await onSubmit(clubData);
      reset();
      setHonours([]);
      setLogoFile(null);
      setLogoPreview('');
      toast.success('Club registered successfully!');
    }
     catch (error) {
       console.error(error.response?.data);
      toast.error('Failed to register club. Please try again.');
    }
  };

  return (
    <div className="bg-theme-page-bg p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-theme-dark">Register New Club</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Club Name *
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'Club name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 100, message: 'Name must be less than 100 characters' }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="Enter club name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Club Logo *
            </label>
            <div className="border-2 border-dashed border-theme-border rounded-md p-4 text-center">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setLogoFile(file);
                  if (file && file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    setLogoPreview(url);
                  } else {
                    setLogoPreview('');
                  }
                }}
                className="hidden"
                id="club-logo-upload"
              />
              <label htmlFor="club-logo-upload" className="cursor-pointer">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="mx-auto h-24 w-24 object-cover rounded-full border" />
                ) : (
                  <div className="text-theme-text-secondary">Click to upload logo (JPG, PNG, WEBP)</div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Stadium Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Stadium Name *
            </label>
            <input
              type="text"
              {...register('stadium', { 
                required: 'Stadium name is required',
                minLength: { value: 2, message: 'Stadium name must be at least 2 characters' }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="Enter stadium name"
            />
            {errors.stadium && (
              <p className="text-red-500 text-sm mt-1">{errors.stadium.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Stadium Capacity
            </label>
            <input
              type="number"
              {...register('stadiumCapacity', { 
                min: { value: 0, message: 'Capacity must be positive' }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="e.g., 50000"
            />
            {errors.stadiumCapacity && (
              <p className="text-red-500 text-sm mt-1">{errors.stadiumCapacity.message}</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              City *
            </label>
            <input
              type="text"
              {...register('city', { 
                required: 'City is required',
                minLength: { value: 2, message: 'City must be at least 2 characters' }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="Enter city"
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Country *
            </label>
            <input
              type="text"
              {...register('country', { 
                required: 'Country is required',
                minLength: { value: 2, message: 'Country must be at least 2 characters' }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="Enter country"
            />
            {errors.country && (
              <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Founded Year *
            </label>
            <input
              type="number"
              {...register('founded', { 
                required: 'Founded year is required',
                min: { value: 1800, message: 'Year must be after 1800' },
                max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="e.g., 1892"
            />
            {errors.founded && (
              <p className="text-red-500 text-sm mt-1">{errors.founded.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Website
            </label>
            <input
              type="url"
              {...register('website', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="https://club-website.com"
            />
            {errors.website && (
              <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="contact@club.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-dark mb-2">
              Phone
            </label>
            <input
              type="tel"
              {...register('phone', {
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: 'Please enter a valid phone number'
                }
              })}
              className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              placeholder="+1234567890"
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>





        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-theme-dark mb-2">
            Description
          </label>
          <textarea
            {...register('description', {
              maxLength: { value: 1000, message: 'Description must be less than 1000 characters' }
            })}
            rows={3}
            className="w-full px-3 py-2 border border-theme-border rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
            placeholder="Brief description of the club..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Honours Section */}
        <div>
          <label className="block text-sm font-medium text-theme-dark mb-2">
            Club Honours
          </label>
          
          {/* Add Honour Form */}
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <input
                type="text"
                value={currentHonour.name}
                onChange={(e) => setCurrentHonour({ ...currentHonour, name: e.target.value })}
                placeholder="Trophy name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              />
              <input
                type="number"
                value={currentHonour.count || ''}
                onChange={(e) => setCurrentHonour({ ...currentHonour, count: parseInt(e.target.value) || 0 })}
                placeholder="Count"
                min="0"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              />
              <input
                type="text"
                value={currentHonour.years}
                onChange={(e) => setCurrentHonour({ ...currentHonour, years: e.target.value })}
                placeholder="Years (comma-separated)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-theme-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={addHonour}
                className="px-4 py-2 bg-theme-primary text-theme-dark rounded-md hover:bg-theme-primary/80 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Honours List */}
          {honours.length > 0 && (
            <div className="space-y-2">
              {honours.map((honour, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border">
                  <div>
                    <span className="font-medium">{honour.name}</span>
                    <span className="text-gray-600 ml-2">({honour.count})</span>
                    {honour.years && honour.years.length > 0 && (
                      <span className="text-gray-500 ml-2">- {honour.years.join(', ')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHonour(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-theme-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-theme-primary text-theme-dark rounded-md hover:bg-theme-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Registering...' : 'Register Club'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClubRegistrationForm;
