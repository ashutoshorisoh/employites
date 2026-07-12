import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation } from './components/shared/Navigation';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminBillingDashboard } from './pages/AdminBillingDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateInterview } from './pages/CandidateInterview';
import { PricingPage } from './pages/PricingPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RefundsPage } from './pages/RefundsPage';
import { CandidateProfile } from './pages/CandidateProfile';



// Protected Route wrapper checking user presence and appropriate role
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: ('admin' | 'recruiter' | 'candidate')[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-zinc-800 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accentPurple border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-200 mt-4">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If authenticated but role mismatch, redirect to landing logic or appropriate route
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'recruiter') return <Navigate to="/recruiter" replace />;
    if (user.role === 'candidate') return <Navigate to="/interview" replace />;
  }

  return <>{children}</>;
};

import { LandingPage } from './pages/LandingPage';

// Landing page wrapper inside Router context to access hooks
const LandingPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginAsCandidate } = useAuth();

  const handleRecruiterStart = () => {
    if (user && user.role === 'recruiter') {
      navigate('/recruiter');
    } else {
      navigate('/login');
    }
  };

  const handleCandidateStart = (token: string) => {
    navigate(`/candidate/dashboard?token=${token}`);
  };

  return <LandingPage onRecruiterStart={handleRecruiterStart} onCandidateStart={handleCandidateStart} />;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navigation />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
            <Route path="/" element={<LandingPageWrapper />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminBillingDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/recruiter"
              element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/candidate/dashboard"
              element={<CandidateInterview />}
            />

            <Route
              path="/candidate/profile"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <CandidateProfile />
                </ProtectedRoute>
              }
            />

            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refunds" element={<RefundsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </MainLayout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
