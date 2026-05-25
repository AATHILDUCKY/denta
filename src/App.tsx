import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { getAuthenticatedUser, getSessionUser } from './lib/session';

import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Blog from './pages/Blog';
import Doctors from './pages/Doctors';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Dashboard, { DoctorDashboard } from './pages/Dashboard';
import PatientPortal from './pages/PatientPortal';
import Navbar from './components/layout/Navbar';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => getSessionUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthenticatedUser().then(setUser).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Dashboard — full viewport, no navbar */}
        <Route
          path="/dashboard/*"
          element={
            user?.role === 'admin' ? <Dashboard user={user} /> :
            user?.role === 'staff' ? <DoctorDashboard user={user} onLogout={() => setUser(null)} /> :
            <Navigate to="/login" replace />
          }
        />

        {/* All other routes — with navbar */}
        <Route path="*" element={
          <div className="min-h-screen bg-brand-bg font-sans text-brand-ink">
            <Navbar user={user} onLogout={() => setUser(null)} />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/service" element={<Portfolio />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/docters" element={<Doctors />} />
                <Route path="/book" element={<Booking />} />
                <Route path="/login" element={(user?.role === 'admin' || user?.role === 'staff') ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />} />
                <Route path="/portal" element={user?.role === 'patient' ? <PatientPortal user={user} /> : <Navigate to="/login" replace />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
}
