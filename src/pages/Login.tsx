import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chrome } from 'lucide-react';
import { motion } from 'motion/react';
import { loginAdmin } from '../lib/session';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginAdmin(username, password);
      onLogin(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <div className="bg-white/90 rounded-[2rem] border border-brand-border p-12 text-center shadow-xl shadow-brand-border/40">
          <div className="flex justify-center mb-10">
            <div className="flex flex-col">
              <span className="text-4xl font-serif font-bold text-brand-primary leading-none tracking-tight">PDH</span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-brand-accent mt-2 font-bold">DentaCare Hospital</span>
            </div>
          </div>

          <h2 className="text-3xl font-serif italic text-brand-primary mb-2">System Access</h2>
          <p className="text-brand-muted text-sm mb-8 italic font-serif">Sign in to access management and appointments.</p>

          <div className="mb-4 text-left">
            <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 text-sm"
              autoComplete="username"
            />
          </div>

          <div className="mb-6 text-left">
            <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-bg-soft px-4 py-3 text-sm"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="mb-4 text-xs text-red-600 font-semibold text-left">{error}</p>}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:brightness-105 transition shadow-xl shadow-brand-border"
          >
            <Chrome className="h-4 w-4 mr-3 text-brand-accent" />
            {loading ? 'Verifying...' : 'Continue'}
          </button>

          <div className="mt-12 pt-10 border-t border-brand-border">
            <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-brand-primary border-b border-brand-primary pb-1">
              Return to Public Site
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
