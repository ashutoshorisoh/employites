import React, { useEffect } from 'react';
import { useAuthStore, User, UserRole } from '../store/AuthState';

// Re-export type definitions for import compatibility in existing files
export type { User, UserRole };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initAuth = useAuthStore((state) => state.initAuth);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Keep the provider wrapper structure to prevent breaking root layout/context nesting in App.tsx
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-accentCyan/30 border-t-accentCyan animate-spin"></div>
        <p className="text-xs">Re-establishing secure session...</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Re-export hook linking directly to our unified Zustand store
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const loading = useAuthStore((state) => state.loading);
  const loginWithPassword = useAuthStore((state) => state.loginWithPassword);
  const registerWithPassword = useAuthStore((state) => state.registerWithPassword);
  const requestRegisterOtp = useAuthStore((state) => state.requestRegisterOtp);
  const loginAsCandidate = useAuthStore((state) => state.loginAsCandidate);
  const loginCandidate = useAuthStore((state) => state.loginCandidate);
  const registerCandidate = useAuthStore((state) => state.registerCandidate);
  const requestCandidateOtp = useAuthStore((state) => state.requestCandidateOtp);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);

  return {
    user,
    token,
    loading,
    loginWithPassword,
    registerWithPassword,
    requestRegisterOtp,
    loginAsCandidate,
    loginCandidate,
    registerCandidate,
    requestCandidateOtp,
    logout,
    updateUser,
  };
};
