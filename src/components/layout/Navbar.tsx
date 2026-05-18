import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../../types';
import { User, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { logoutUser } from '../../lib/session';

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/';
  };

  const navLinks = [
    { name: 'All Pages', path: '/' },
    { name: 'Services', path: '/service' },
    { name: 'Doctor', path: '/docters' },
    { name: 'Book an Appointment', path: '/book', highlighted: true },
  ];

  return (
    <nav className={`${isHome ? 'absolute top-0 left-0 right-0 bg-transparent border-b-0' : 'sticky top-0 border-b border-brand-border/70 bg-white/90 backdrop-blur-xl'} z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-2xl font-serif font-semibold text-brand-ink leading-none tracking-tight">Dentiva</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2 rounded-full bg-white px-2.5 py-2 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.5)]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[11px] uppercase tracking-[0.04em] font-bold transition-all duration-300 rounded-full px-5 py-2.5 ${
                  link.highlighted
                    ? 'bg-brand-accent text-white hover:brightness-95'
                    : location.pathname === link.path
                      ? 'text-brand-ink'
                      : 'text-brand-ink hover:bg-brand-bg'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center space-x-4 border-l border-brand-border pl-4 ml-1">
                {user.role === 'patient' && (
                  <Link
                    to="/portal"
                    className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold text-brand-muted hover:text-brand-ink transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Portal</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-[10px] uppercase tracking-widest font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold text-brand-ink border border-brand-border px-4 py-2 rounded-full transition-all hover:bg-brand-bg"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-ink p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-brand-border py-4 px-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                link.highlighted
                  ? 'bg-brand-accent text-white'
                  : location.pathname === link.path
                    ? 'bg-brand-bg text-brand-ink'
                    : 'text-brand-muted hover:bg-brand-bg hover:text-brand-ink'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-2 border-t border-brand-border" />

          {user ? (
            <>
              {user.role === 'patient' && (
                <Link
                  to="/portal"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-brand-muted hover:bg-brand-bg hover:text-brand-ink"
                >
                  Patient Portal
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="block w-full text-left rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-brand-muted hover:bg-brand-bg hover:text-brand-ink"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
