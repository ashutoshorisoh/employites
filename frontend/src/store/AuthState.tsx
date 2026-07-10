import { create } from 'zustand';

export type UserRole = 'admin' | 'recruiter' | 'candidate';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  candidateToken?: string;
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
    const storedToken = localStorage.getItem('skreener_token');
    const storedUserStr = localStorage.getItem('skreener_user');
    
    if (storedToken) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          // Merge custom stored user properties with fresh server profile details
          const existingUser = storedUserStr ? JSON.parse(storedUserStr) : {};
          const mergedUser: User = {
            ...existingUser,
            ...userData,
            id: userData.id,
            email: userData.email,
            role: userData.role as UserRole,
            name: userData.name
          };
          
          set({ token: storedToken, user: mergedUser, loading: false });
          localStorage.setItem('skreener_user', JSON.stringify(mergedUser));
        } else {
          get().logout();
          set({ loading: false });
        }
      } catch (e) {
        console.error('Failed to validate active session:', e);
        if (storedUserStr) {
          set({ token: storedToken, user: JSON.parse(storedUserStr), loading: false });
        } else {
          set({ loading: false });
        }
      }
    } else {
      set({ loading: false });
    }
  },

  loginWithPassword: async (email, password) => {
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
      localStorage.setItem('skreener_token', activeToken);

      // Fetch user profile info
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        // Keep ALL returned data from the API response payload (merging data & userData)
        const activeUser: User = {
          ...data,
          ...userData,
          id: userData.id || data.id,
          email: userData.email || data.email || email,
          role: (userData.role || data.role) as UserRole,
          name: userData.name || data.name
        };
        
        set({ token: activeToken, user: activeUser });
        localStorage.setItem('skreener_user', JSON.stringify(activeUser));
        return { success: true, message: 'Logged in successfully.', role: activeUser.role };
      }
      
      return { success: false, message: 'Failed to retrieve profile data.' };
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
        body: JSON.stringify({ name, email, password, otp, role: 'recruiter' })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Registration failed.' };
      }

      const activeToken = data.access_token;
      localStorage.setItem('skreener_token', activeToken);

      // Fetch user profile info
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        // Keep ALL returned data from the API response payload (merging data & userData)
        const activeUser: User = {
          ...data,
          ...userData,
          id: userData.id || data.id,
          email: userData.email || data.email || email,
          role: (userData.role || data.role) as UserRole,
          name: userData.name || data.name
        };
        
        set({ token: activeToken, user: activeUser });
        localStorage.setItem('skreener_user', JSON.stringify(activeUser));
        return { success: true, message: 'Registered and logged in successfully.', role: activeUser.role };
      }

      return { success: false, message: 'Failed to retrieve profile data.' };
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
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.detail || 'Invalid invitation code or details.' };
      }

      const activeToken = data.access_token;
      localStorage.setItem('skreener_token', activeToken);

      // Keep ALL returned data from the API response payload
      const activeUser: User = {
        ...data,
        id: data.id || 'candidate_user',
        email: data.email || email,
        role: (data.role || 'candidate') as UserRole,
        name: data.name || `${firstName} ${lastName}`,
        candidateToken: data.candidateToken || tokenInput
      };
      
      set({ token: activeToken, user: activeUser });
      localStorage.setItem('skreener_user', JSON.stringify(activeUser));
      return { success: true, role: 'candidate' };
    } catch (error) {
      console.error('Candidate checkin error:', error);
      return { success: false, message: 'Connection to authentication server failed.' };
    }
  },

  logout: () => {
    localStorage.removeItem('skreener_token');
    localStorage.removeItem('skreener_user');
    set({ token: null, user: null });
  },

  updateUser: (fields) => {
    const currentUser = get().user;
    if (currentUser) {
      const updated = { ...currentUser, ...fields };
      set({ user: updated });
      localStorage.setItem('skreener_user', JSON.stringify(updated));
    }
  }
}));