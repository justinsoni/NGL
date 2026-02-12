import React from 'react';
import { Link } from 'react-router-dom';
import { Club } from '../types';
import { ChevronRightIcon, ExternalLinkIcon } from './icons';

interface ClubCardProps {
    club: Club;
}

const ClubCard: React.FC<ClubCardProps> = ({ club }) => {
    return (
        <div className="bg-theme-page-bg rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col group">
            <Link to={`/clubs/${club.id}`} className="p-4 flex-grow">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <img src={club.logo} alt={`${club.name} logo`} className="h-10 w-10 mr-4" />
                        <h3 className="font-bold text-lg text-theme-dark group-hover:text-theme-primary transition-colors">{club.name}</h3>
                    </div>
                    <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                </div>
            </Link>
            <div className="border-t border-theme-border p-3 bg-theme-secondary-bg flex items-center justify-end gap-3 rounded-b-lg">
                <button className="text-sm font-semibold text-theme-text-secondary hover:text-theme-dark px-4 py-1.5 rounded-md hover:bg-theme-border transition-colors">
                    Follow
                </button>
                <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-theme-dark bg-theme-border/50 hover:bg-theme-border px-4 py-1.5 rounded-md transition-colors"
                >
                    Visit Website <ExternalLinkIcon className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
};

export default ClubCard;