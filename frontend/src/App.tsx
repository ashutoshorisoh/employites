import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation } from './components/shared/Navigation';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { CandidateInterview } from './pages/CandidateInterview';

import { LandingPage } from './pages/LandingPage';
import { useNavigate } from 'react-router-dom';

// Protected Route wrapper checking user presence and appropriate role
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: ('admin' | 'recruiter' | 'candidate')[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-accentPurple border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-zinc-500 mt-4">Loading authorization token state...</p>
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
    navigate(`/interview?token=${token}`);
  };

  return <LandingPage onRecruiterStart={handleRecruiterStart} onCandidateStart={handleCandidateStart} />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPageWrapper />} />
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/admin" 
              element={<AdminDashboard />} 
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
              path="/interview" 
              element={<CandidateInterview />} 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
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
