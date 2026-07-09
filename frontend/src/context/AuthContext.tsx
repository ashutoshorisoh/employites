import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  candidateToken?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  registerWithPassword: (name: string, email: string, password: string, otp: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  requestRegisterOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  loginAsCandidate: (token: string, email: string, firstName: string, lastName: string) => Promise<{ success: boolean; role?: UserRole; message?: string }>;
  logout: () => void;
  updateUser: (fields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL config. Fallback to standard localhost port.
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and validate token on boot
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('skreener_token');
      if (storedToken) {
        try {
          // Fetch current user details dynamically from the Supabase back-end
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const userData = await res.json();
            setToken(storedToken);
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role as UserRole,
              name: userData.name
            });
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (e) {
          console.error('Failed to validate active session:', e);
          // Network error: use fallback stored values offline
          const storedUser = localStorage.getItem('skreener_user');
          if (storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithPassword = async (email: string, password: string): Promise<{ success: boolean; message: string; role?: UserRole }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Incorrect email or password.' };
      }

      const activeToken = data.access_token;
      setToken(activeToken);
      localStorage.setItem('skreener_token', activeToken);

      // Fetch verified user details
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        const activeUser: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role as UserRole,
          name: userData.name
        };
        setUser(activeUser);
        localStorage.setItem('skreener_user', JSON.stringify(activeUser));
        return { success: true, message: 'Logged in successfully.', role: userData.role };
      }
      
      return { success: false, message: 'Failed to retrieve profile data.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  };

  const registerWithPassword = async (name: string, email: string, password: string, otp: string): Promise<{ success: boolean; message: string; role?: UserRole }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp, role: 'recruiter' })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Registration failed.' };
      }

      const activeToken = data.access_token;
      setToken(activeToken);
      localStorage.setItem('skreener_token', activeToken);

      // Fetch user profile info
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const activeUser: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role as UserRole,
          name: userData.name
        };
        setUser(activeUser);
        localStorage.setItem('skreener_user', JSON.stringify(activeUser));
        return { success: true, message: 'Registered and logged in successfully.', role: userData.role };
      }

      return { success: false, message: 'Failed to retrieve profile data.' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  };

  const requestRegisterOtp = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/otp-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Failed to dispatch verification code.' };
      }
      return { success: true, message: data.message || 'Verification code sent.' };
    } catch (err) {
      console.error('OTP request error:', err);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  };

  const loginAsCandidate = async (tokenInput: string, email: string, firstName: string, lastName: string): Promise<{ success: boolean; role?: UserRole; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/candidate/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput,
          email: email,
          first_name: firstName,
          last_name: lastName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Invalid invitation code or details.' };
      }

      const activeToken = data.access_token;
      setToken(activeToken);
      localStorage.setItem('skreener_token', activeToken);

      const activeUser: User = {
        id: 'candidate_user',
        email: email,
        role: 'candidate',
        name: `${firstName} ${lastName}`,
        candidateToken: tokenInput
      };
      
      setUser(activeUser);
      localStorage.setItem('skreener_user', JSON.stringify(activeUser));
      return { success: true, role: 'candidate' };
    } catch (error) {
      console.error('Candidate checkin error:', error);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('skreener_token');
    localStorage.removeItem('skreener_user');
  };

  const updateUser = (fields: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...fields };
      setUser(updated);
      localStorage.setItem('skreener_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithPassword,
        registerWithPassword,
        requestRegisterOtp,
        loginAsCandidate,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
