import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../../types';
import { User, LogIn, Menu, X, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { logoutUser } from '../../lib/session';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleLogout = async () => {
    await logoutUser();
    onLogout();
    window.location.href = '/';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/service' },
    { name: 'Doctor', path: '/docters' },
    { name: 'Contact', path: '/#contact' },
    { name: 'Book Visit', path: '/book', highlighted: true },
  ];

  return (
    <nav className={`${isHome ? 'absolute top-0 left-0 right-0 bg-white/70 border-b border-white/70' : 'sticky top-0 border-b border-brand-border/70 bg-white/95'} z-50 backdrop-blur-xl`}>
      <div className="hidden lg:block border-b border-brand-border/60 bg-brand-ink text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between text-xs font-semibold">
          <a href="tel:+94772071641" className="inline-flex items-center gap-2 text-white/90 hover:text-white">
            <Phone className="h-3.5 w-3.5 text-brand-accent" />
            +94 77 207 1641
          </a>
          <a
            href="https://www.google.com/maps/search/?api=1&query=127%2FA%20Main%20Street%20Kinniya%2002%20Sri%20Lanka"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white"
          >
            <MapPin className="h-3.5 w-3.5 text-brand-accent" />
            127/A, Main Street, Kinniya 02
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3" aria-label="J rish Kinniya home">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-primary text-xl font-black italic text-white shadow-[0_18px_34px_-22px_rgba(29,78,216,0.75)]">
              J
            </span>
            <span className="leading-none">
              <span className="block text-2xl font-black tracking-tight text-brand-ink">
                <span className="text-brand-primary">J</span> rish
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">Kinniya</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-2 rounded-full bg-white px-2.5 py-2 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.5)]">
            {navLinks.map((link) => (
              link.path.startsWith('/#') ? (
                <a
                  key={link.path}
                  href={link.path}
                  className="text-[11px] uppercase tracking-[0.04em] font-bold transition-all duration-300 rounded-full px-5 py-2.5 text-brand-ink hover:bg-brand-bg"
                >
                  {link.name}
                </a>
              ) : (
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
              )
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
                {user.role === 'admin' && (
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-bold text-brand-muted hover:text-brand-ink transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
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
            link.path.startsWith('/#') ? (
              <a
                key={link.path}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-brand-muted hover:bg-brand-bg hover:text-brand-ink"
              >
                {link.name}
              </a>
            ) : (
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
            )
          ))}

          <div className="rounded-xl bg-brand-bg-soft px-4 py-3 text-sm text-brand-muted">
            <a href="tel:+94772071641" className="flex items-center gap-2 font-semibold text-brand-ink">
              <Phone className="h-4 w-4 text-brand-accent" />
              +94 77 207 1641
            </a>
            <p className="mt-2 flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
              127/A, Main Street, Kinniya 02
            </p>
          </div>

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
              {user.role === 'admin' && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-brand-muted hover:bg-brand-bg hover:text-brand-ink"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setIsOpen(false); }}
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
