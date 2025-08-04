import React from 'react';
import { Link } from 'react-router-dom';
import { LeagueLogoIcon } from '../components/icons';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <LeagueLogoIcon className="w-24 h-24 text-theme-primary mb-4" />
        <h1 className="text-6xl font-extrabold text-theme-dark">404</h1>
        <h2 className="text-2xl font-semibold text-theme-text-secondary mt-2">Page Not Found</h2>
        <p className="text-theme-text-secondary mt-4 max-w-md">
            It seems the page you are looking for has been misplaced. Don't worry, even the best strikers miss sometimes.
        </p>
        <Link 
            to="/" 
            className="mt-8 inline-block bg-theme-primary hover:bg-theme-primary-dark text-theme-dark font-bold py-3 px-8 rounded-lg transition-transform duration-300 hover:scale-105"
        >
            Return to Homepage
        </Link>
    </div>
  );
};

export default NotFoundPage;