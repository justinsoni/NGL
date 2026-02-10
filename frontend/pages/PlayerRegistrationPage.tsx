import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { PlayerRegistration, Position } from '../types';
import { POSITIONS, LEAGUES } from '../constants';
import { countryService, CountryOption } from '@/services/countryService';
import { playerRegistrationSchema, PlayerRegistrationFormData, validateFileUpload } from '@/utils/validationSchemas';

interface PlayerRegistrationPageProps {
    onSubmitRegistration: (registration: Omit<PlayerRegistration, 'id' | 'status' | 'submittedAt'>) => void;
}

const PlayerRegistrationPage: React.FC<PlayerRegistrationPageProps> = ({ onSubmitRegistration }) => {
    const navigate = useNavigate();

    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [countriesLoading, setCountriesLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{
        profilePhoto: File | null;
        identityCard: File | null;
    }>({
        profilePhoto: null,
        identityCard: null
    });
    const [previewUrls, setPreviewUrls] = useState<{
        profilePhoto: string | null;
        identityCard: string | null;
    }>({
        profilePhoto: null,
        identityCard: null
    });

    // Date boundaries for logical DOB: between 10 and 60 years old
    const today = new Date();
    const maxDobDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const minDobDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate());
    const formatDate = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const minDobStr = formatDate(minDobDate);
    const maxDobStr = formatDate(maxDobDate);

    // Initialize react-hook-form with yup validation
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isValid, isDirty }
    } = useForm({
        resolver: yupResolver(playerRegistrationSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            dob: '',
            age: 15,
            position: 'Forward' as Position,
            nationality: '',
            previousClub: '',
            leaguesPlayed: [],
            bio: '',
            profilePhoto: null,
            identityCard: null,
            // Medical & Fitness defaults
            hasInjuryHistory: false,
            // injuryNature and lastInjuryDate are optional/conditional so undefined by default is fine 
            fitnessStatus: '',
            minimumSalary: 0
        }
    });

    // Watch form values for real-time validation
    const watchedValues = watch();

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            if (previewUrls.profilePhoto && previewUrls.profilePhoto.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrls.profilePhoto);
            }
            if (previewUrls.identityCard && previewUrls.identityCard.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrls.identityCard);
            }
        };
    }, [previewUrls]);

    // Fetch clubs and countries on component mount
    useEffect(() => {
        const fetchData = async () => {
            // Fetch countries
            setCountriesLoading(true);
            try {
                console.log('Fetching countries from API...');
                const countriesData = await countryService.getCountries();
                setCountries(countriesData);
                console.log('Fetched countries:', countriesData.length);
            } catch (err) {
                console.error('Error fetching countries:', err);
            } finally {
                setCountriesLoading(false);
            }
        };

        fetchData();
    }, [setValue]);

    // Custom input handlers for sanitization
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Remove invalid characters and multiple consecutive spaces
        let sanitized = raw.replace(/[^A-Za-z\s'\-]/g, '').replace(/\s{2,}/g, ' ');

        // Capitalize the first letter of each word
        if (sanitized.length > 0) {
            sanitized = sanitized.split(/[\s\-]/).map(word => {
                if (word.length > 0) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                return word;
            }).join(' ');
        }

        setValue('name', sanitized, { shouldValidate: true });
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const digitsOnly = raw.replace(/[^0-9]/g, '');
        setValue('phone', digitsOnly, { shouldValidate: true });
    };

    const handleNationalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
        setValue('nationality', sanitized, { shouldValidate: true });
    };

    const handlePreviousClubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const sanitized = raw.replace(/[^A-Za-z\s'\-]/g, '');
        setValue('previousClub', sanitized, { shouldValidate: true });
    };

    const handleLeagueChange = (league: string, checked: boolean) => {
        const currentLeagues = watchedValues.leaguesPlayed || [];
        const updatedLeagues = checked
            ? [...currentLeagues, league]
            : currentLeagues.filter(l => l !== league);
        setValue('leaguesPlayed', updatedLeagues, { shouldValidate: true });
    };

    const handleFileUpload = (field: 'profilePhoto' | 'identityCard', file: File) => {
        // Validate file using our validation schema
        const validationErrors = validateFileUpload(file, field);

        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }

        // Clear any previous errors
        setError('');

        // Store the file
        setUploadedFiles(prev => ({
            ...prev,
            [field]: file
        }));

        // Update form value
        setValue(field, file, { shouldValidate: true });

        // Create preview URL for images
        if (file.type.startsWith('image/')) {
            const previewUrl = URL.createObjectURL(file);
            setPreviewUrls(prev => ({
                ...prev,
                [field]: previewUrl
            }));
        } else {
            // For PDFs, just show filename
            setPreviewUrls(prev => ({
                ...prev,
                [field]: file.name
            }));
        }
    };

    const uploadToCloudinary = async (file: File, uploadPreset: string): Promise<string> => {
        const url = `${(import.meta as any).env.VITE_CLOUDINARY_URL || 'https://api.cloudinary.com/v1_1/dmuilu78u/auto/upload'}`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        try {
            const res = await fetch(url, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to upload file: ${res.status} ${errorText}`);
            }

            const data = await res.json();
            if (!data.secure_url) {
                throw new Error("No secure_url returned from Cloudinary");
            }

            return data.secure_url;
        } catch (err) {
            console.error("Cloudinary upload error:", err);
            throw err;
        }
    };

    const onSubmit = async (data: PlayerRegistrationFormData) => {
        setError('');
        setIsSubmitting(true);

        try {
            let imageUrl = '';
            let identityCardUrl = '';

            // Upload files to Cloudinary
            if (uploadedFiles.profilePhoto) {
                imageUrl = await uploadToCloudinary(uploadedFiles.profilePhoto, 'ml_default');
            }
            if (uploadedFiles.identityCard) {
                identityCardUrl = await uploadToCloudinary(uploadedFiles.identityCard, 'ml_default');
            }

            const registration = {
                ...data,
                phone: data.phone.replace(/\D/g, ''), // Ensure only digits
                imageUrl,
                identityCardUrl,
                age: Number(data.age),
                // clubId removed - player enters as general pool/free agent
                reviewedAt: undefined,
                reviewedBy: undefined,
                rejectionReason: undefined
            };

            const baseURL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseURL}/players/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registration),
            });

            if (!response.ok) {
                let message = 'Failed to register player';
                try {
                    const responseData = await response.json();
                    if (responseData && typeof responseData.message === 'string') {
                        message = responseData.message;
                    }
                } catch (_) { /* ignore parse error */ }
                if (response.status === 409 && !message) {
                    message = 'Email already registered. Please use a different email.';
                }
                throw new Error(message);
            }

            alert('Registration submitted successfully! You will be notified once your application is reviewed.');
            navigate('/');
        } catch (error: any) {
            setError(error.message || 'Unable to submit your registration at this time. Please try again or contact support if the issue persists.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-white">
                        <h1 className="text-4xl font-bold text-center mb-2">Player Registration</h1>
                        <p className="text-center text-blue-100 text-lg">
                            Join the National Gaming League and showcase your skills with your preferred club
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Error Banner */}
                        {Object.keys(errors).length > 0 && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center mb-6">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Please fix the highlighted errors before submitting.
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            {/* Personal Information */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            {...register('name')}
                                            type="text"
                                            onChange={handleNameChange}
                                            pattern="[A-Z][A-Za-z\s'\-]*"
                                            title="Each word in the name must start with a capital letter. Letters, spaces, apostrophes and hyphens only. Multiple consecutive spaces are not allowed."
                                            aria-invalid={errors.name ? 'true' : 'false'}
                                            aria-describedby={errors.name ? 'name-error' : undefined}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.name
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.name && (
                                            <div id="name-error" className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.name.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Age *
                                        </label>
                                        <input
                                            {...register('age')}
                                            type="number"
                                            min={15}
                                            max={45}
                                            aria-invalid={errors.age ? 'true' : 'false'}
                                            aria-describedby={errors.age ? 'age-error' : undefined}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.age
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            placeholder="15"
                                        />
                                        {errors.age && (
                                            <div id="age-error" className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.age.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            {...register('email')}
                                            type="email"
                                            aria-invalid={errors.email ? 'true' : 'false'}
                                            aria-describedby={errors.email ? 'email-error' : undefined}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.email
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            placeholder="your.email@example.com"
                                        />
                                        {errors.email && (
                                            <div id="email-error" className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.email.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            {...register('phone')}
                                            type="tel"
                                            onChange={handlePhoneChange}
                                            pattern="[0-9]{7,15}"
                                            title="Digits only, 7 to 15 numbers"
                                            aria-invalid={errors.phone ? 'true' : 'false'}
                                            aria-describedby={errors.phone ? 'phone-error' : undefined}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.phone
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                        {errors.phone && (
                                            <div id="phone-error" className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.phone.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Date of Birth *
                                        </label>
                                        <input
                                            {...register('dob')}
                                            type="date"
                                            min={minDobStr}
                                            max={maxDobStr}
                                            aria-invalid={errors.dob ? 'true' : 'false'}
                                            aria-describedby={errors.dob ? 'dob-error' : undefined}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.dob
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                        />
                                        {errors.dob && (
                                            <div id="dob-error" className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.dob.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nationality *
                                        </label>
                                        <Controller
                                            name="nationality"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <select
                                                        {...field}
                                                        aria-invalid={errors.nationality ? 'true' : 'false'}
                                                        aria-describedby={errors.nationality ? 'nationality-error' : undefined}
                                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white text-black ${errors.nationality
                                                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                            : 'border-gray-300 focus:ring-blue-500'
                                                            }`}
                                                        disabled={countriesLoading}
                                                    >
                                                        <option value="">Select your nationality</option>
                                                        {countries.map(country => (
                                                            <option key={country.code} value={country.name} className="text-black">
                                                                {country.flag} {country.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.nationality && (
                                                        <div id="nationality-error" className="mt-2 flex items-center text-sm text-red-600">
                                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            {errors.nationality.message}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Gaming Information */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Gaming Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Preferred Position *
                                        </label>
                                        <Controller
                                            name="position"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <select
                                                        {...field}
                                                        aria-invalid={errors.position ? 'true' : 'false'}
                                                        aria-describedby={errors.position ? 'position-error' : undefined}
                                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white text-black ${errors.position
                                                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                            : 'border-gray-300 focus:ring-blue-500'
                                                            }`}
                                                    >
                                                        {POSITIONS.map(position => (
                                                            <option key={position} value={position} className="text-black">{position}</option>
                                                        ))}
                                                    </select>
                                                    {errors.position && (
                                                        <div id="position-error" className="mt-2 flex items-center text-sm text-red-600">
                                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            {errors.position.message}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Previous Club
                                        </label>
                                        <input
                                            {...register('previousClub')}
                                            type="text"
                                            onChange={handlePreviousClubChange}
                                            pattern="[A-Za-z\s'\-]*"
                                            title="Letters, spaces, apostrophes and hyphens only"
                                            aria-invalid={errors.previousClub ? 'true' : 'false'}
                                            aria-describedby={errors.previousClub ? 'previousClub-error' : undefined}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.previousClub
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            placeholder="Enter your previous club (if any)"
                                        />
                                        {errors.previousClub && (
                                            <div id="previousClub-error" className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.previousClub.message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Minimum Salary Expectation ($) *
                                        </label>
                                        <input
                                            {...register('minimumSalary')}
                                            type="number"
                                            min="0"
                                            step="100"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.minimumSalary
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            placeholder="Enter annual salary expectation"
                                        />
                                        {errors.minimumSalary && (
                                            <div className="mt-2 text-sm text-red-600">
                                                {errors.minimumSalary.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Leagues Played */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Leagues Played *</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {LEAGUES.map(league => (
                                        <label key={league} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={(watchedValues.leaguesPlayed || []).includes(league)}
                                                onChange={(e) => handleLeagueChange(league, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">{league}</span>
                                        </label>
                                    ))}
                                    {errors.leaguesPlayed && (
                                        <div className="mt-2 flex items-center text-sm text-red-600 col-span-full">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.leaguesPlayed.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Medical and Fitness History */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Medical and Fitness History</h2>
                                    <p className="ml-4 text-sm text-gray-500 hidden md:block">
                                        Collected to support injury management and future predictive analytics.
                                    </p>
                                </div>
                                <p className="text-sm text-gray-500 mb-6 md:hidden">
                                    Collected to support injury management and future predictive analytics.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Injury History (Yes / No) *
                                        </label>
                                        <div className="flex space-x-6">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    value="true"
                                                    {...register("hasInjuryHistory")}
                                                    // Convert string value to boolean for the form
                                                    onChange={() => setValue("hasInjuryHistory", true, { shouldValidate: true })}
                                                    checked={watch("hasInjuryHistory") === true}
                                                    className="form-radio h-5 w-5 text-red-600 focus:ring-red-500"
                                                />
                                                <span className="ml-2 text-gray-700">Yes</span>
                                            </label>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="radio"
                                                    value="false"
                                                    {...register("hasInjuryHistory")}
                                                    onChange={() => setValue("hasInjuryHistory", false, { shouldValidate: true })}
                                                    checked={watch("hasInjuryHistory") === false}
                                                    className="form-radio h-5 w-5 text-green-600 focus:ring-green-500"
                                                />
                                                <span className="ml-2 text-gray-700">No</span>
                                            </label>
                                        </div>
                                        {errors.hasInjuryHistory && (
                                            <div className="mt-2 text-sm text-red-600">
                                                {errors.hasInjuryHistory.message}
                                            </div>
                                        )}
                                    </div>

                                    {watch("hasInjuryHistory") && (
                                        <>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Nature of Previous Injuries *
                                                </label>
                                                <textarea
                                                    {...register('injuryNature')}
                                                    rows={3}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.injuryNature
                                                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                        : 'border-gray-300 focus:ring-blue-500'
                                                        }`}
                                                    placeholder="Describe your previous injuries..."
                                                />
                                                {errors.injuryNature && (
                                                    <div className="mt-2 text-sm text-red-600">
                                                        {errors.injuryNature.message}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Date of Last Injury *
                                                </label>
                                                <input
                                                    {...register('lastInjuryDate')}
                                                    type="date"
                                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${errors.lastInjuryDate
                                                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                        : 'border-gray-300 focus:ring-blue-500'
                                                        }`}
                                                />
                                                {errors.lastInjuryDate && (
                                                    <div className="mt-2 text-sm text-red-600">
                                                        {errors.lastInjuryDate.message}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    <div className={watch("hasInjuryHistory") ? "" : "md:col-span-2"}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Current Fitness Status *
                                        </label>
                                        <select
                                            {...register('fitnessStatus')}
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white text-black ${errors.fitnessStatus
                                                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                        >
                                            <option value="">Select status</option> // Fixed empty option
                                            <option value="Fully Fit">Fully Fit</option>
                                            <option value="Match Fit">Match Fit</option>
                                            <option value="Returning from Injury">Returning from Injury</option>
                                            <option value="Injured">Injured</option>
                                            <option value="Recovering">Recovering</option>
                                        </select>
                                        {errors.fitnessStatus && (
                                            <div className="mt-2 text-sm text-red-600">
                                                {errors.fitnessStatus.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* File Uploads */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Documents & Photo</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Profile Photo
                                        </label>
                                        {previewUrls.profilePhoto ? (
                                            <div className="relative">
                                                <img
                                                    src={previewUrls.profilePhoto}
                                                    alt="Profile preview"
                                                    className="w-full h-48 object-cover rounded-lg border-2 border-green-300"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPreviewUrls(prev => ({ ...prev, profilePhoto: null }));
                                                            setUploadedFiles(prev => ({ ...prev, profilePhoto: null }));
                                                            setValue('profilePhoto', null, { shouldValidate: true });
                                                        }}
                                                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="mt-2 text-center">
                                                    <p className="text-sm text-green-600 font-medium">✓ Photo uploaded successfully</p>
                                                    <p className="text-xs text-gray-500">{uploadedFiles.profilePhoto?.name}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload('profilePhoto', file);
                                                    }}
                                                    className="hidden"
                                                    id="profile-photo"
                                                />
                                                <label htmlFor="profile-photo" className="cursor-pointer">
                                                    <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">Upload Profile Photo</p>
                                                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP up to 5MB</p>
                                                </label>
                                            </div>
                                        )}
                                        {errors.profilePhoto && (
                                            <div className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.profilePhoto.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Identity Card / Player Card * (PDF/JPG/PNG only)
                                        </label>
                                        {previewUrls.identityCard ? (
                                            <div className="relative">
                                                {uploadedFiles.identityCard?.type.startsWith('image/') ? (
                                                    <img
                                                        src={previewUrls.identityCard}
                                                        alt="Identity document preview"
                                                        className="w-full h-48 object-cover rounded-lg border-2 border-green-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-48 bg-gray-100 rounded-lg border-2 border-green-300 flex items-center justify-center">
                                                        <div className="text-center">
                                                            <svg className="mx-auto h-12 w-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <p className="text-sm font-medium text-gray-700">PDF Document</p>
                                                            <p className="text-xs text-gray-500">{uploadedFiles.identityCard?.name}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPreviewUrls(prev => ({ ...prev, identityCard: null }));
                                                            setUploadedFiles(prev => ({ ...prev, identityCard: null }));
                                                            setValue('identityCard', null, { shouldValidate: true });
                                                        }}
                                                        className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="mt-2 text-center">
                                                    <p className="text-sm text-green-600 font-medium">✓ Document uploaded successfully</p>
                                                    <p className="text-xs text-gray-500">{uploadedFiles.identityCard?.name}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="application/pdf,image/jpeg,image/jpg,image/png"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload('identityCard', file);
                                                    }}
                                                    className="hidden"
                                                    id="identity-card"
                                                />
                                                <label htmlFor="identity-card" className="cursor-pointer">
                                                    <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">Upload Identity Document *</p>
                                                    <p className="text-xs text-gray-500 mt-1">PDF/JPG/PNG up to 10MB</p>
                                                </label>
                                            </div>
                                        )}
                                        {errors.identityCard && (
                                            <div className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.identityCard.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                <div className="flex items-center mb-6">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">About You</h2>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Bio / Description *
                                    </label>
                                    <textarea
                                        {...register('bio')}
                                        rows={6}
                                        aria-invalid={errors.bio ? 'true' : 'false'}
                                        aria-describedby={errors.bio ? 'bio-error' : undefined}
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-none ${errors.bio
                                            ? 'border-red-300 focus:ring-red-500 bg-red-50'
                                            : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                        placeholder="Tell us about your gaming experience, achievements, and why you want to join this club... (minimum 10 characters)"
                                    />
                                    {errors.bio && (
                                        <div id="bio-error" className="mt-2 flex items-center text-sm text-red-600">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.bio.message}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="flex-1 bg-gray-500 text-white py-4 px-6 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </div>
                                    ) : (
                                        'Submit Registration'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerRegistrationPage;