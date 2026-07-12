import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Loader2, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const CandidateProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/v1/candidate/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg('Profile email successfully updated.');
        // Optionally update the local AuthContext with the new email.
        updateUser({ email: data.candidate.email }); 
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMsg('Network error while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-zinc-100">Profile Settings</h1>
        <Link 
          to="/candidate/dashboard" 
          className="text-accentPurple hover:text-accentCyan font-semibold text-sm transition-colors"
        >
          Back to Portal
        </Link>
      </div>

      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>
        
        <form onSubmit={handleSave} className="space-y-6">
          
          {errorMsg && (
            <div className="flex items-center gap-3 bg-red-950/50 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium">
              <CheckCircle className="w-5 h-5 shrink-0" />
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-zinc-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-accentPurple rounded-xl py-3 pl-11 pr-4 text-zinc-100 font-medium placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-accentPurple transition-all"
                placeholder="your.email@example.com"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              This email will be used for all notifications regarding your application status.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={loading || !email || email === user?.email}
              className="glow-btn flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
