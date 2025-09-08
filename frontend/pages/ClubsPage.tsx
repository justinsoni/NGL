import React, { useEffect, useState } from 'react';
import PageBanner from '../components/PageBanner';
import ClubCard from '../components/ClubCard';
import clubService from '../services/clubService';

const ClubsPage: React.FC = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                setLoading(true);
                const res = await clubService.getClubs();
                setClubs(res.data);
            } catch (err) {
                setError('Failed to load clubs');
            } finally {
                setLoading(false);
            }
        };
        fetchClubs();
    }, []);

    return (
        <div className="min-h-screen">
            <PageBanner title="Clubs" />
            <div className="container mx-auto p-4 md:p-6">
                {/* Filters */}
                <div className="bg-theme-page-bg rounded-lg p-3 mb-6 flex items-center justify-between shadow-md flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-theme-dark">2024/25 Clubs</h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <select className="bg-theme-secondary-bg text-theme-dark border border-theme-border rounded-md p-2 appearance-none focus:outline-none focus:ring-2 focus:ring-theme-primary">
                            <option>2024/25</option>
                            <option>2023/24</option>
                        </select>
                        <button className="bg-theme-secondary-bg text-theme-dark rounded-md p-2 hover:bg-theme-border font-semibold">Reset</button>
                    </div>
                </div>

                {/* Clubs Grid */}
                {loading ? (
                    <div>Loading clubs...</div>
                ) : error ? (
                    <div className="text-red-500">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {clubs.map((club: any) => (
                            <ClubCard key={club.id || club._id} club={club} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubsPage;