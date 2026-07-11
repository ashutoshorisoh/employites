import { create } from 'zustand';

export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  candidateToken?: string;
  resume_url?: string;
  [key: string]: any; // Keep all potential custom fields from the API response
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  registerWithPassword: (name: string, email: string, password: string, otp: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  requestRegisterOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  loginAsCandidate: (token: string, email: string, firstName: string, lastName: string) => Promise<{ success: boolean; role?: UserRole; message?: string }>;
  loginCandidate: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  registerCandidate: (firstName: string, lastName: string, email: string, password: string, otp: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  requestCandidateOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (fields: Partial<User>) => void;
  initAuth: () => Promise<void>;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,

  initAuth: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: 'include'
      });
      if (res.ok) {
        const userData = await res.json();
        const activeUser: User = {
          ...userData,
          id: userData.id,
          email: userData.email,
          role: userData.role as UserRole,
          name: userData.name
        };
        
        set({ token: 'session_active', user: activeUser, loading: false });
      } else {
        set({ token: null, user: null, loading: false });
      }
    } catch (e) {
      console.error('Failed to validate active session:', e);
      set({ token: null, user: null, loading: false });
    }
  },

  loginWithPassword: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Incorrect email or password.' };
      }

      const activeUser: User = {
        ...data,
        id: data.id,
        email: data.email || email,
        role: data.role as UserRole,
        name: data.name
      };
      
      set({ token: 'session_active', user: activeUser });
      return { success: true, message: 'Logged in successfully.', role: activeUser.role };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  },

  registerWithPassword: async (name, email, password, otp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp, role: 'recruiter' }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Registration failed.' };
      }

      const activeUser: User = {
        ...data,
        id: data.id,
        email: data.email || email,
        role: data.role as UserRole,
        name: data.name
      };
      
      set({ token: 'session_active', user: activeUser });
      return { success: true, message: 'Registered and logged in successfully.', role: activeUser.role };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  },

  requestRegisterOtp: async (email) => {
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
  },

  loginAsCandidate: async (tokenInput, email, firstName, lastName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/candidate/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput,
          email: email,
          first_name: firstName,
          last_name: lastName
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Invalid invitation code or details.' };
      }

      const activeUser: User = {
        ...data,
        id: data.id,
        email: data.email || email,
        role: data.role as UserRole,
        name: data.name || `${firstName} ${lastName}`,
        candidateToken: tokenInput
      };
      
      set({ token: 'session_active', user: activeUser });
      return { success: true, role: 'candidate' };
    } catch (error) {
      console.error('Candidate checkin error:', error);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  },

  loginCandidate: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/candidate/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Incorrect candidate credentials.' };
      }

      const activeUser: User = {
        ...data,
        id: data.id,
        email: data.email || email,
        role: 'candidate',
        name: data.name
      };
      
      set({ token: 'session_active', user: activeUser });
      return { success: true, message: 'Logged in successfully.', role: 'candidate' };
    } catch (error) {
      console.error('Candidate login error:', error);
      return { success: false, message: 'Connection to candidate auth failed.' };
    }
  },

  registerCandidate: async (firstName, lastName, email, password, otp) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/candidate/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, otp }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Candidate registration failed.' };
      }

      const activeUser: User = {
        ...data,
        id: data.id,
        email: data.email || email,
        role: 'candidate',
        name: data.name
      };
      
      set({ token: 'session_active', user: activeUser });
      return { success: true, message: 'Registered successfully.', role: 'candidate' };
    } catch (error) {
      console.error('Candidate registration error:', error);
      return { success: false, message: 'Connection to candidate auth failed.' };
    }
  },

  requestCandidateOtp: async (email) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/candidate/otp/request`, {
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
      console.error('Candidate OTP error:', err);
      return { success: false, message: 'Connection to candidate auth failed.' };
    }
  },

  logout: () => {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.error('Failed to trigger server logout:', err));

    set({ token: null, user: null });
  },

  updateUser: (fields) => {
    const currentUser = get().user;
    if (currentUser) {
      const updated = { ...currentUser, ...fields };
      set({ user: updated });
    }
  }
}));