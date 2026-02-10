import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlayerRegistrationCard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="mt-6 w-full max-w-sm bg-white rounded-xl shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300 overflow-hidden border border-theme-border">
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg shrink-0">
                        <svg className="w-5 h-5 text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Are you a Player?</h3>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/player-registration')}
                    className="py-2 px-4 bg-theme-primary hover:bg-theme-primary-dark text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                    Register
                </button>
            </div>
        </div>
    );
};

export default PlayerRegistrationCard;
