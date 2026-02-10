

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { LeagueLogoIcon, MenuIcon, CloseIcon, CartIcon } from './icons';
import { UserRole, CartItem } from '../types';
import LogoutButton from './LogoutButton';

interface NavbarProps {
  isLoggedIn: boolean;
  userRole: UserRole | null;
  onLogout: () => void;
  cart: CartItem[];
  onRemoveFromCart: (productId: string | number, size?: string) => void;
  onUpdateQuantity: (productId: string | number, delta: number, size?: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, userRole, onLogout, cart, onRemoveFromCart, onUpdateQuantity }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isStorePage = location.pathname.startsWith('/store');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
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
    `relative text-theme-dark uppercase tracking-wider font-semibold text-sm pb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-theme-accent after:transition-transform after:duration-300 ${isActive ? 'after:scale-x-100' : 'after:scale-x-0'} hover:after:scale-x-100`;

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

          {/* Cart Icon with Badge */}
          {isStorePage && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-theme-dark hover:opacity-80 transition-opacity"
            >
              <CartIcon className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 shadow-sm">
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          )}

          {isLoggedIn ? (
            <>
              {userRole === 'admin' && <Link to="/admin" className="text-theme-dark font-semibold hover:opacity-80 transition">Admin</Link>}
              {userRole === 'coach' && <Link to="/coach" className="text-theme-dark font-semibold hover:opacity-80 transition">Coach</Link>}
              {userRole === 'clubManager' && <Link to="/club-manager" className="text-theme-dark font-semibold hover:opacity-80 transition">My Club</Link>}
              <LogoutButton onLocalLogout={onLogout} />
            </>
          ) : (
            <Link to="/login" className="bg-theme-primary text-theme-dark px-4 py-2 rounded-md font-semibold hover:bg-theme-primary-dark transition-colors">Login/Registration</Link>
          )}

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
              {isStorePage && (
                <button
                  onClick={() => { setIsCartOpen(true); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 py-2 px-4 text-sm font-semibold"
                >
                  <CartIcon className="h-5 w-5" />
                  Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
                </button>
              )}
              {isLoggedIn ? (
                <>
                  {userRole === 'admin' && <Link to="/admin" className="text-theme-dark font-semibold block py-2 px-4" onClick={() => setIsMenuOpen(false)}>Admin</Link>}
                  {userRole === 'coach' && <Link to="/coach" className="text-theme-dark font-semibold block py-2 px-4" onClick={() => setIsMenuOpen(false)}>Coach</Link>}
                  {userRole === 'clubManager' && <Link to="/club-manager" className="text-theme-dark font-semibold block py-2 px-4" onClick={() => setIsMenuOpen(false)}>My Club</Link>}
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
      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-black text-white italic">
          <h2 className="text-xl font-black uppercase tracking-tighter">Your Bag</h2>
          <button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition-transform">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-6xl text-gray-200">🛒</span>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Your bag is empty</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Add some colors to it!</p>
              </div>
              <button
                onClick={() => { setIsCartOpen(false); }}
                className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.id}-${item.selectedSize || idx}`} className="flex gap-4 group">
                <div className="w-24 h-30 bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                  )}
                </div>
                <div className="flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-black uppercase tracking-tight text-gray-900 pr-4">{item.name}</h4>
                    <span className="text-xs font-bold text-gray-900 italic">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                  {item.selectedSize && (
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2 italic">Size: {item.selectedSize}</p>
                  )}
                  <div className="mt-auto flex justify-between items-center">
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize)}
                        className="p-1 px-3 hover:bg-gray-50 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-black">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize)}
                        className="p-1 px-3 hover:bg-gray-50 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(item.id, item.selectedSize)}
                      className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600 hover:underline transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
            <div className="flex justify-between items-center font-black italic uppercase">
              <span className="text-xs tracking-widest text-gray-500">Total</span>
              <span className="text-xl text-red-600">₹{cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(0)}</span>
            </div>
            <button
              onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
              className="w-full bg-black text-white py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-red-600 transition-all shadow-xl text-center"
            >
              Checkout Now
            </button>
            <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
              Secure payment processing
            </p>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;