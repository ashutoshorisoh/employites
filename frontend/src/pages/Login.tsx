import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Sparkles, Clipboard } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithPassword, registerWithPassword, requestRegisterOtp } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const handleRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setFeedback({ type: '', message: '' });

    if (isRegistering) {
      if (!name) {
        setFeedback({ type: 'error', message: 'Name is required for registration.' });
        setIsLoading(false);
        return;
      }

      if (!showOtpVerification) {
        // Step 1: Send registration verification code
        const res = await requestRegisterOtp(email);
        setIsLoading(false);
        if (res.success) {
          setShowOtpVerification(true);
          setFeedback({ type: 'success', message: 'Verification code sent to your email. Please check your inbox and enter it below.' });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      } else {
        // Step 2: Confirm OTP & Complete registration
        if (!otp || otp.length !== 6) {
          setFeedback({ type: 'error', message: 'Please enter the 6-digit verification code.' });
          setIsLoading(false);
          return;
        }
        const res = await registerWithPassword(name, email, password, otp);
        setIsLoading(false);
        if (res.success) {
          setFeedback({ type: 'success', message: res.message });
          setTimeout(() => navigate('/recruiter'), 1000);
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } else {
      // Login flow
      const res = await loginWithPassword(email, password);
      setIsLoading(false);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setTimeout(() => {
          if (res.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/recruiter');
          }
        }, 1000);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md relative">
        {/* Colorful Glowing Orbs in the background */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-accentPurple/10 blur-3xl -z-10"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-accentCyan/10 blur-3xl -z-10"></div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-950/80 border border-zinc-900 rounded-xl p-1 mb-6">
          <button
            onClick={() => {
              setIsRegistering(false);
              setShowOtpVerification(false);
              setFeedback({ type: '', message: '' });
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              !isRegistering
                ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white shadow-lg' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            HR Sign In
          </button>
          <button
            onClick={() => {
              setIsRegistering(true);
              setShowOtpVerification(false);
              setFeedback({ type: '', message: '' });
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              isRegistering
                ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white shadow-lg' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            HR Register
          </button>
        </div>

        {/* Form Container */}
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>

          <div>
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-1.5">
                {isRegistering ? (showOtpVerification ? 'Verify Your Email' : 'Create Recruiter Account') : 'HR Portal Sign In'}{' '}
                <Sparkles className="w-4 h-4 text-accentCyan" />
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {isRegistering 
                  ? (showOtpVerification ? 'Enter the 6-digit confirmation code.' : 'Register your organization to start posting jobs.') 
                  : 'Access your recruiter dashboard and candidate ratings.'}
              </p>
            </div>

            {feedback.message && (
              <div className={`p-3.5 rounded-xl border text-xs font-medium mb-5 ${
                feedback.type === 'success' 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
              }`}>
                {feedback.message}
              </div>
            )}

              <form onSubmit={handleRecruiterSubmit} className="space-y-4">
                {showOtpVerification ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Enter Verification Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm font-bold tracking-widest text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOtpVerification(false)}
                      className="text-xs text-zinc-400 hover:text-white mt-3 block underline"
                    >
                      ← Edit details
                    </button>
                  </div>
                ) : (
                  <>
                    {isRegistering && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                            <User className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Professional Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="recruiter@acme.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="glow-btn w-full py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      {isRegistering ? (showOtpVerification ? 'Verify & Create Account' : 'Request Verification Code') : 'Sign In Now'}{' '}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Hint */}
              <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
                <span className="text-[10px] text-zinc-600 block mb-1">DEMO CREDENTIALS</span>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-900/40">
                    <span>Recruiter: <strong className="text-zinc-300">recruiter@acme.com</strong></span>
                    <button 
                      onClick={() => {
                        setEmail('recruiter@acme.com');
                        setPassword('recruiter123');
                        setIsRegistering(false);
                      }}
                      className="text-[9px] text-accentCyan hover:underline font-bold"
                    >
                      Autofill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};
