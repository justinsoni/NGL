import React from 'react';
import { Link } from 'react-router-dom';
import { LeagueLogoIcon, TwitterIcon, FacebookIcon, InstagramIcon, YoutubeIcon } from './icons';

const Footer = () => {
  return (
    <footer className="bg-theme-light text-theme-dark pt-12 pb-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Logo and About */}
          <div className="flex flex-col items-start">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <LeagueLogoIcon className="h-12 w-12 text-theme-primary" />
              <span className="font-bold text-2xl">NGL</span>
            </Link>
            <p className="text-theme-text-secondary text-sm">The Official Hub for the NGL.</p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/matches" className="text-theme-text-secondary hover:text-theme-dark transition-colors">Fixtures</Link></li>
              <li><Link to="/players" className="text-theme-text-secondary hover:text-theme-dark transition-colors">Players</Link></li>
              <li><Link to="/table" className="text-theme-text-secondary hover:text-theme-dark transition-colors">League Table</Link></li>
              <li><Link to="/clubs" className="text-theme-text-secondary hover:text-theme-dark transition-colors">Clubs</Link></li>
            </ul>
          </div>

          {/* Column 3: More */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">More</h3>
            <ul className="space-y-2">
              <li><Link to="/media" className="text-theme-text-secondary hover:text-theme-dark transition-colors">Media</Link></li>
              <li><Link to="/store" className="text-theme-text-secondary hover:text-theme-dark transition-colors">Store</Link></li>
              <li><Link to="/tickets" className="text-theme-text-secondary hover:text-theme-dark transition-colors">Tickets</Link></li>
            </ul>
          </div>
          
          {/* Column 4: Social */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-theme-text-secondary hover:text-theme-dark transition-colors"><TwitterIcon className="h-6 w-6" /></a>
              <a href="#" className="text-theme-text-secondary hover:text-theme-dark transition-colors"><FacebookIcon className="h-6 w-6" /></a>
              <a href="#" className="text-theme-text-secondary hover:text-theme-dark transition-colors"><InstagramIcon className="h-6 w-6" /></a>
              <a href="#" className="text-theme-text-secondary hover:text-theme-dark transition-colors"><YoutubeIcon className="h-6 w-6" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-theme-border pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-theme-text-secondary">
          <p>&copy; {new Date().getFullYear()} NGL. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="#" className="hover:text-theme-dark">Privacy Policy</Link>
            <Link to="#" className="hover:text-theme-dark">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;