import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerRegistration, Position } from '../types';
import { CLUBS, POSITIONS, LEAGUES } from '../constants';

interface PlayerRegistrationPageProps {
    onSubmitRegistration: (registration: Omit<PlayerRegistration, 'id' | 'status' | 'submittedAt'>) => void;
}

const PlayerRegistrationPage: React.FC<PlayerRegistrationPageProps> = ({ onSubmitRegistration }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dob: '',
        position: 'Forward' as Position,
        nationality: '',
        previousClub: '',
        leaguesPlayed: [] as string[],
        imageUrl: '',
        identityCardUrl: '',
        bio: '',
        clubId: CLUBS.length > 0 ? CLUBS[0].id : 0
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLeagueChange = (league: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            leaguesPlayed: checked 
                ? [...prev.leaguesPlayed, league]
                : prev.leaguesPlayed.filter(l => l !== league)
        }));
    };

    const handleFileUpload = (field: 'imageUrl' | 'identityCardUrl', file: File) => {
        // In a real application, this would upload to a file storage service
        const fakeUrl = `https://example.com/uploads/${file.name}`;
        setFormData(prev => ({
            ...prev,
            [field]: fakeUrl
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Validation
        if (!formData.name || !formData.email || !formData.phone || !formData.dob) {
            setError('Please fill in all required fields.');
            setIsSubmitting(false);
            return;
        }

        if (!formData.identityCardUrl) {
            setError('Please upload your identity card or player card for verification.');
            setIsSubmitting(false);
            return;
        }

        try {
            const registration: Omit<PlayerRegistration, 'id' | 'status' | 'submittedAt'> = {
                ...formData,
                reviewedAt: undefined,
                reviewedBy: undefined,
                rejectionReason: undefined
            };

            onSubmitRegistration(registration);
            
            alert('Registration submitted successfully! You will be notified once your application is reviewed.');
            navigate('/');
        } catch (error) {
            setError('Failed to submit registration. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-theme-light py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-theme-page-bg rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-theme-dark mb-6 text-center">Player Registration</h1>
                    <p className="text-theme-text-secondary text-center mb-8">
                        Join the National Gaming League by registering with your preferred club. 
                        Your application will be reviewed by the club management.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div className="bg-theme-secondary-bg p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-theme-dark mb-4">Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Nationality *
                                    </label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Gaming Information */}
                        <div className="bg-theme-secondary-bg p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-theme-dark mb-4">Gaming Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Preferred Position *
                                    </label>
                                    <select
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    >
                                        {POSITIONS.map(position => (
                                            <option key={position} value={position}>{position}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Preferred Club *
                                    </label>
                                    <select
                                        name="clubId"
                                        value={formData.clubId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    >
                                        {CLUBS.map(club => (
                                            <option key={club.id} value={club.id}>{club.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Previous Club
                                    </label>
                                    <input
                                        type="text"
                                        name="previousClub"
                                        value={formData.previousClub}
                                        onChange={handleInputChange}
                                        placeholder="Enter your previous club (if any)"
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Leagues Played */}
                        <div className="bg-theme-secondary-bg p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-theme-dark mb-4">Leagues Played</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {LEAGUES.map(league => (
                                    <label key={league} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.leaguesPlayed.includes(league)}
                                            onChange={(e) => handleLeagueChange(league, e.target.checked)}
                                            className="rounded border-theme-border text-theme-primary focus:ring-theme-primary"
                                        />
                                        <span className="text-sm text-theme-dark">{league}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* File Uploads */}
                        <div className="bg-theme-secondary-bg p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-theme-dark mb-4">Documents & Photo</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Profile Photo
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('imageUrl', file);
                                        }}
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                    {formData.imageUrl && (
                                        <p className="text-xs text-green-600 mt-1">✓ Photo uploaded</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-dark mb-1">
                                        Identity Card / Player Card *
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('identityCardUrl', file);
                                        }}
                                        required
                                        className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                    />
                                    {formData.identityCardUrl && (
                                        <p className="text-xs text-green-600 mt-1">✓ Identity document uploaded</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="bg-theme-secondary-bg p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-theme-dark mb-4">About You</h2>
                            <div>
                                <label className="block text-sm font-medium text-theme-dark mb-1">
                                    Bio / Description
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={4}
                                    placeholder="Tell us about your gaming experience, achievements, and why you want to join this club..."
                                    className="w-full px-3 py-2 border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-theme-primary"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-theme-primary text-theme-dark py-3 px-6 rounded-md hover:bg-theme-primary-dark transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PlayerRegistrationPage;
