

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LeagueLogoIcon, MenuIcon, CloseIcon } from './icons';
import { UserRole } from '../types';
import LogoutButton from './LogoutButton';

interface NavbarProps {
  isLoggedIn: boolean;
  userRole: UserRole | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, userRole, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      if (isMenuOpen) {
          setIsVisible(true);
          return;
      }

      if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [isMenuOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-theme-dark uppercase tracking-wider font-semibold text-sm pb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-theme-primary after:transition-transform after:duration-300 ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'} hover:after:scale-x-100`;
  
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-2 px-4 text-sm rounded ${isActive ? 'bg-theme-primary-dark' : ''}`;

  const navLinks = [
    { to: '/', text: 'Home' },
    { to: '/matches', text: 'Fixtures' },
    { to: '/players', text: 'Players' },
    { to: '/table', text: 'Table' },
    { to: '/clubs', text: 'Clubs' },
    { to: '/media', text: 'Media' },
    { to: '/store', text: 'Store' },
  ];

  return (
    <nav className={`bg-theme-light sticky top-0 z-50 shadow-lg transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-24">
          <Link to="/" className="flex items-center space-x-2 text-theme-dark hover:opacity-80 transition-opacity">
            <LeagueLogoIcon className="h-10 w-10" />
            <span className="font-bold text-xl hidden sm:block">NGL</span>
          </Link>

          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.text}
              </NavLink>
            ))}
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {userRole === 'admin' && <Link to="/admin" className="text-theme-dark font-semibold hover:opacity-80 transition">Admin</Link>}
                {userRole === 'coach' && <Link to="/coach" className="text-theme-dark font-semibold hover:opacity-80 transition">Coach</Link>}
                {userRole === 'manager' && <Link to="/club-manager" className="text-theme-dark font-semibold hover:opacity-80 transition">My Club</Link>}
                <LogoutButton onLocalLogout={onLogout} />
              </>
            ) : (
              <Link to="/login" className="bg-theme-primary text-theme-dark px-4 py-2 rounded-md font-semibold hover:bg-theme-primary-dark transition-colors">Login/Registration</Link>
            )}
          </div>
          
          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-theme-dark">
              {isMenuOpen ? <CloseIcon className="h-8 w-8" /> : <MenuIcon className="h-8 w-8" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-theme-light/95 backdrop-blur-sm absolute top-24 left-0 w-full">
          <div className="flex flex-col px-4 pt-2 pb-4 space-y-2 text-theme-dark">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                {link.text}
              </NavLink>
            ))}
            <div className="border-t border-white/20 pt-4 mt-2 flex flex-col space-y-2">
              {isLoggedIn ? (
                <>
                  {userRole === 'admin' && <Link to="/admin" className="text-theme-dark font-semibold block py-2 px-4" onClick={() => setIsMenuOpen(false)}>Admin</Link>}
                  {userRole === 'coach' && <Link to="/coach" className="text-theme-dark font-semibold block py-2 px-4" onClick={() => setIsMenuOpen(false)}>Coach</Link>}
                  {userRole === 'manager' && <Link to="/club-manager" className="text-theme-dark font-semibold block py-2 px-4" onClick={() => setIsMenuOpen(false)}>My Club</Link>}
                  <LogoutButton
                    onLocalLogout={() => { onLogout(); setIsMenuOpen(false); }}
                    className="bg-theme-primary text-theme-dark w-full text-left px-4 py-2 rounded-md font-semibold hover:bg-theme-primary-dark transition-colors"
                  />
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="bg-theme-primary text-theme-dark w-full text-left px-4 py-2 rounded-md font-semibold hover:bg-theme-primary-dark transition-colors">Login</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;