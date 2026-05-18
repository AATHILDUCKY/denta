import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { getAuthenticatedUser, getSessionUser } from './lib/session';

// Pages - to be created
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Blog from './pages/Blog';
import Doctors from './pages/Doctors';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientPortal from './pages/PatientPortal';
import Navbar from './components/layout/Navbar';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => getSessionUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapUser = async () => {
      const authUser = await getAuthenticatedUser();
      setUser(authUser);
      setLoading(false);
    };
    bootstrapUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <Router>
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
            <Route path="/login" element={user?.role === 'admin' ? <Navigate to="/dashboard" replace /> : <Login onLogin={setUser} />} />
            
            <Route
              path="/dashboard/*"
              element={user?.role === 'admin' ? <Dashboard user={user} /> : <Navigate to="/login" />}
            />
            
            <Route 
              path="/portal" 
              element={
                user?.role === 'patient' 
                ? <PatientPortal user={user} /> 
                : <Navigate to="/login" />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
