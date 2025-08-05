import React from 'react';
import { Link } from 'react-router-dom';
import { LeagueLogoIcon, TwitterIcon, FacebookIcon, InstagramIcon, YoutubeIcon } from './icons';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-theme-primary via-theme-primary-dark to-theme-accent text-white pt-12 pb-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Logo and About */}
          <div className="flex flex-col items-start">
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <LeagueLogoIcon className="h-12 w-12 text-white" />
              <span className="font-bold text-2xl">NGL</span>
            </Link>
            <p className="text-white/80 text-sm">The Official Hub for the NGL.</p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/matches" className="text-white/80 hover:text-white transition-colors">Fixtures</Link></li>
              <li><Link to="/players" className="text-white/80 hover:text-white transition-colors">Players</Link></li>
              <li><Link to="/table" className="text-white/80 hover:text-white transition-colors">League Table</Link></li>
              <li><Link to="/clubs" className="text-white/80 hover:text-white transition-colors">Clubs</Link></li>
            </ul>
          </div>

          {/* Column 3: More */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">More</h3>
            <ul className="space-y-2">
              <li><Link to="/media" className="text-white/80 hover:text-white transition-colors">Media</Link></li>
              <li><Link to="/store" className="text-white/80 hover:text-white transition-colors">Store</Link></li>
              <li><Link to="/tickets" className="text-white/80 hover:text-white transition-colors">Tickets</Link></li>
            </ul>
          </div>
          
          {/* Column 4: Social */}
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-white/80 hover:text-white transition-colors"><TwitterIcon className="h-6 w-6" /></a>
              <a href="#" className="text-white/80 hover:text-white transition-colors"><FacebookIcon className="h-6 w-6" /></a>
              <a href="#" className="text-white/80 hover:text-white transition-colors"><InstagramIcon className="h-6 w-6" /></a>
              <a href="#" className="text-white/80 hover:text-white transition-colors"><YoutubeIcon className="h-6 w-6" /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/80">
          <p>&copy; {new Date().getFullYear()} NGL. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="#" className="hover:text-white">Privacy Policy</Link>
            <Link to="#" className="hover:text-white">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;