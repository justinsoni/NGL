import React from 'react';
import PageBanner from '../components/PageBanner';
import ClubCard from '../components/ClubCard';
import { CLUBS } from '../constants';

const ClubsPage: React.FC = () => {
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {CLUBS.map(club => (
                        <ClubCard key={club.id} club={club} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClubsPage;