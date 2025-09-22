import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerRegistration, Position, Club } from '../types';
import { POSITIONS, LEAGUES } from '../constants';
import { clubService } from '@/services/clubService';

interface PlayerRegistrationPageProps {
    onSubmitRegistration: (registration: Omit<PlayerRegistration, 'id' | 'status' | 'submittedAt'>) => void;
}

const PlayerRegistrationPage: React.FC<PlayerRegistrationPageProps> = ({ onSubmitRegistration }) => {
    const navigate = useNavigate();

    const [clubs, setClubs] = useState<Club[]>([]);
    const [clubsLoading, setClubsLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dob: '',
        age: 15 as number,
        position: 'Forward' as Position,
        nationality: '',
        previousClub: '',
        leaguesPlayed: [] as string[],
        imageUrl: '',
        identityCardUrl: '',
        bio: '',
        clubId: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ageWarning, setAgeWarning] = useState('');
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

    useEffect(() => {
        console.log('Fetching clubs from API...');
        const fetchClubs = async () => {
            setClubsLoading(true);
            try {
                const res = await clubService.getClubs();
                const clubsWithId = res.data.map((club: any) => ({
                    ...club,
                    id: club._id || club.id
                }));

                console.log('Fetched clubs:', clubsWithId);
                setClubs(clubsWithId);

                setFormData(prev => ({
                    ...prev,
                    clubId: clubsWithId.length > 0 ? clubsWithId[0].id : ''
                }));
            } catch (err) {
                console.error('Error fetching clubs:', err);
            } finally {
                setClubsLoading(false);
            }
        };
        fetchClubs();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Real-time age validation
        if (name === 'age') {
            const numericAge = Number(value);
            if (value && !Number.isFinite(numericAge)) {
                setAgeWarning('Please enter a valid age.');
            } else if (value && numericAge < 15) {
                setAgeWarning('Registration is only available for players aged 15 and above.');
            } else if (value && numericAge > 45) {
                setAgeWarning('Registration is only available for players aged 45 and below.');
            } else {
                setAgeWarning('');
            }
        }
    };

    const handleLeagueChange = (league: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            leaguesPlayed: checked 
                ? [...prev.leaguesPlayed, league]
                : prev.leaguesPlayed.filter(l => l !== league)
        }));
    };

    // Strict field-specific input handlers
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow letters, spaces, apostrophes and hyphens only
        const sanitized = raw.replace(/[^A-Za-z\s'\-]/g, '');
        setFormData(prev => ({ ...prev, name: sanitized }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Digits only
        const digitsOnly = raw.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, phone: digitsOnly }));
    };

    const handleNationalityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow letters and spaces only
        const sanitized = raw.replace(/[^A-Za-z\s]/g, '');
        setFormData(prev => ({ ...prev, nationality: sanitized }));
    };

    const handlePreviousClubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow letters, spaces, apostrophes and hyphens only
        const sanitized = raw.replace(/[^A-Za-z\s'\-]/g, '');
        setFormData(prev => ({ ...prev, previousClub: sanitized }));
    };

    const handleFileUpload = (field: 'profilePhoto' | 'identityCard', file: File) => {
        // Validate file type
        const allowedTypes = field === 'profilePhoto'
            ? ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            : ['application/pdf'];

        if (!allowedTypes.includes(file.type)) {
            setError(
                `Invalid file type for ${field === 'profilePhoto' ? 'profile photo' : 'identity document'}. ` +
                `${field === 'profilePhoto' ? 'Please upload an image (JPG, PNG, WEBP).' : 'Only PDF documents are allowed for identity verification.'}`
            );
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setError(`File size too large. Please upload a file smaller than 5MB.`);
            return;
        }

        // Clear any previous errors
        setError('');

        // Store the file
        setUploadedFiles(prev => ({
            ...prev,
            [field]: file
        }));

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

        // In a real application, this would upload to a file storage service
        // For now, we'll simulate with a fake URL that includes the actual filename
        const fakeUrl = `https://uploads.ngl.com/${Date.now()}-${file.name}`;
        const formField = field === 'profilePhoto' ? 'imageUrl' : 'identityCardUrl';
        setFormData(prev => ({
            ...prev,
            [formField]: fakeUrl
        }));
    };


    const uploadToCloudinary = async (file: File, uploadPreset: string): Promise<string> => {
        const url = `https://api.cloudinary.com/v1_1/dmuilu78u/auto/upload`; 

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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setAgeWarning('');
        setIsSubmitting(true);

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.dob || formData.age === undefined || formData.age === null) {
            setError('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        // Basic email format validation
        const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailPattern.test(formData.email.trim().toLowerCase())) {
            setError('Please enter a valid email address.');
            setIsSubmitting(false);
            return;
        }

        // Name validation: letters, spaces, apostrophes, hyphens only
        const namePattern = /^[A-Za-z][A-Za-z\s'\-]*$/;
        if (!namePattern.test(formData.name.trim())) {
            setError("Name can contain letters, spaces, apostrophes, and hyphens only.");
            setIsSubmitting(false);
            return;
        }

        // Phone validation: digits only, 7-15 digits
        const phoneDigits = formData.phone.replace(/\D/g, '');
        const phonePattern = /^[0-9]{7,15}$/;
        if (!phonePattern.test(phoneDigits)) {
            setError('Phone number must be digits only (7 to 15 numbers).');
            setIsSubmitting(false);
            return;
        }

        // Nationality validation: letters and spaces only
        const nationalityPattern = /^[A-Za-z\s]+$/;
        if (!nationalityPattern.test(formData.nationality.trim())) {
            setError('Nationality must contain letters and spaces only.');
            setIsSubmitting(false);
            return;
        }

        // DOB logical validation: age between 10 and 60 years
        const dobDate = new Date(formData.dob);
        const tooYoung = dobDate > maxDobDate;
        const tooOld = dobDate < minDobDate;
        if (Number.isNaN(dobDate.getTime()) || tooYoung || tooOld) {
            setError('Please enter a valid date of birth: age must be between 10 and 60.');
            setIsSubmitting(false);
            return;
        }

        // Age validation: must be between 15 and 45
        const numericAge = Number(formData.age);
        if (!Number.isFinite(numericAge)) {
            setError('Please enter a valid age.');
            setIsSubmitting(false);
            return;
        }
        if (numericAge < 15) {
            setError('Registration is only available for players aged 15 and above. Please verify your age and try again.');
            setIsSubmitting(false);
            return;
        }
        if (numericAge > 45) {
            setError('Registration is only available for players aged 45 and below. Please verify your age and try again.');
            setIsSubmitting(false);
            return;
        }

        // Position validation
        if (!POSITIONS.includes(formData.position)) {
            setError('Please select a valid position.');
            setIsSubmitting(false);
            return;
        }

        // Club selection validation
        if (!formData.clubId || !clubs.some(c => String(c.id) === String(formData.clubId))) {
            setError('Please select a valid club.');
            setIsSubmitting(false);
            return;
        }

        // Optional: Bio length soft limit
        if (formData.bio && formData.bio.length > 1000) {
            setError('Bio is too long. Please keep it under 1000 characters.');
            setIsSubmitting(false);
            return;
        }

        if (!uploadedFiles.identityCard) {
            setError('Please upload your identity card or player card for verification.');
            setIsSubmitting(false);
            return;
        }

        try {
            let imageUrl = formData.imageUrl;
            let identityCardUrl = formData.identityCardUrl;

            if (uploadedFiles.profilePhoto) {
                imageUrl = await uploadToCloudinary(uploadedFiles.profilePhoto, 'ml_default');
            }
            if (uploadedFiles.identityCard) {
                identityCardUrl = await uploadToCloudinary(uploadedFiles.identityCard, 'ml_default');
            }

            const selectedClub = clubs.find(c => String(c.id) === String(formData.clubId));
            const registration = {
                ...formData,
                phone: phoneDigits,
                imageUrl,
                identityCardUrl,
                age: numericAge,
                clubName: selectedClub?.name || undefined,
                reviewedAt: undefined,
                reviewedBy: undefined,
                rejectionReason: undefined
            };

            const response = await fetch('http://localhost:5000/api/players/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registration),
            });

            if (!response.ok) {
                let message = 'Failed to register player';
                try {
                    const data = await response.json();
                    if (data && typeof data.message === 'string') {
                        message = data.message;
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
                        <form onSubmit={handleSubmit} className="space-y-8">
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
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            pattern="[A-Za-z][A-Za-z\s'\-]*"
                                            title="Letters, spaces, apostrophes and hyphens only"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Age *
                                        </label>
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleInputChange}
                                            min={15}
                                            max={45}
                                            required
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                                                ageWarning 
                                                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                                                    : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                            placeholder="15"
                                        />
                                        {ageWarning && (
                                            <div className="mt-2 flex items-center text-sm text-red-600">
                                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {ageWarning}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            pattern="[0-9]{7,15}"
                                            title="Digits only, 7 to 15 numbers"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Date of Birth *
                                        </label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={formData.dob}
                                            onChange={handleInputChange}
                                            min={minDobStr}
                                            max={maxDobStr}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nationality *
                                        </label>
                                        <input
                                            type="text"
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleNationalityChange}
                                            pattern="[A-Za-z\s]+"
                                            title="Letters and spaces only"
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            placeholder="e.g., United States"
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
                                        <select
                                            name="position"
                                            value={formData.position}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-black"
                                        >
                                            {POSITIONS.map(position => (
                                                <option key={position} value={position} className="text-black">{position}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Preferred Club *
                                        </label>
                                        <select
                                            name="clubId"
                                            value={formData.clubId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-black"
                                            disabled={clubsLoading || clubs.length === 0}
                                        >
                                            {clubs.map(club => (
                                                <option key={club.id} value={club.id} className="text-black">{club.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Previous Club
                                        </label>
                                        <input
                                            type="text"
                                            name="previousClub"
                                            value={formData.previousClub}
                                            onChange={handlePreviousClubChange}
                                            pattern="[A-Za-z\s'\-]*"
                                            title="Letters, spaces, apostrophes and hyphens only"
                                            placeholder="Enter your previous club (if any)"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        />
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
                                    <h2 className="text-2xl font-bold text-gray-800">Leagues Played</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {LEAGUES.map(league => (
                                        <label key={league} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.leaguesPlayed.includes(league)}
                                                onChange={(e) => handleLeagueChange(league, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">{league}</span>
                                        </label>
                                    ))}
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
                                                            setFormData(prev => ({ ...prev, imageUrl: '' }));
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
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Identity Card / Player Card * (PDF only)
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
                                                            setFormData(prev => ({ ...prev, identityCardUrl: '' }));
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
                                                    accept="application/pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload('identityCard', file);
                                                    }}
                                                    required
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
                                                    <p className="text-xs text-gray-500 mt-1">PDF up to 5MB</p>
                                                </label>
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
                                        Bio / Description
                                    </label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        rows={6}
                                        placeholder="Tell us about your gaming experience, achievements, and why you want to join this club..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                    />
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
