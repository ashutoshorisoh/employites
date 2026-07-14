import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithPassword, registerWithPassword, requestRegisterOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'register' in location.state) {
      setIsRegistering(!!location.state.register);
    }
  }, [location.state]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-[85vh] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-accentPurple/5 blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-accentCyan/5 blur-3xl -z-10 animate-pulse"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Segment Tabs Control */}
        <div className="flex bg-zinc-950/80 border border-zinc-900/60 rounded-2xl p-1 shadow-inner backdrop-blur-md">
          <button
            onClick={() => {
              setIsRegistering(false);
              setShowOtpVerification(false);
              setFeedback({ type: '', message: '' });
            }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 ${!isRegistering
                ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white shadow-md'
                : 'text-zinc-200 hover:text-zinc-300'
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
            className={`flex-1 py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 ${isRegistering
                ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white shadow-md'
                : 'text-zinc-200 hover:text-zinc-300'
              }`}
          >
            HR Register
          </button>
        </div>

        {/* Auth Box Form Container */}
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple via-accentCyan to-accentPink"></div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-100 flex items-center gap-2">
                {isRegistering ? (showOtpVerification ? 'Verify Identity' : 'Recruiter Registration') : 'Recruiter Portal'}{' '}
                <Sparkles className="w-4.5 h-4.5 text-accentCyan" />
              </h2>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                {isRegistering
                  ? (showOtpVerification ? 'Submit the 6-digit verification code.' : 'Setup a corporate account to launch async job pipelines.')
                  : 'Log in to audit candidates, manage screenings, and tune AI settings.'}
              </p>
            </div>

            {feedback.message && (
              <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed ${feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                  : 'bg-rose-50 text-rose-800 border-rose-200/60'
                }`}>
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleRecruiterSubmit} className="space-y-4">
              {showOtpVerification ? (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-200">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="****"
                      className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-850 focus:border-accentPurple/50 rounded-xl text-zinc-100 placeholder-zinc-200 focus:outline-none transition-all text-xs font-bold tracking-[0.2em] text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOtpVerification(false)}
                    className="text-[10px] text-zinc-200 hover:text-accentCyan mt-2 block underline transition-colors"
                  >
                    ← Edit corporate email details
                  </button>
                </div>
              ) : (
                <>
                  {isRegistering && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-200">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-850 focus:border-accentPurple/50 rounded-xl text-zinc-100 placeholder-zinc-200 focus:outline-none transition-all text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Corporate Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-200">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="recruiter@acme.com"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-850 focus:border-accentPurple/50 rounded-xl text-zinc-100 placeholder-zinc-200 focus:outline-none transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-200">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-zinc-950/80 border border-zinc-850 focus:border-accentPurple/50 rounded-xl text-zinc-100 placeholder-zinc-200 focus:outline-none transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-200 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="glow-btn w-full py-3.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-extrabold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-all mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing Credentials...
                  </>
                ) : (
                  <>
                    {isRegistering ? (showOtpVerification ? 'Confirm & Create Account' : 'Dispatch Email OTP') : 'Enter HR Console'}{' '}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* autofill sandbox details helper */}
            <div className="mt-8 pt-6 border-t border-zinc-900/60 text-center">
              <span className="text-[9px] font-bold tracking-widest text-zinc-400 block mb-2 uppercase">Sandbox Credentials</span>
              <div className="text-[10px] text-zinc-200 space-y-1">
                <div className="flex justify-between items-center py-2 border-b border-zinc-900/40">
                  <span>Recruiter: <strong className="text-zinc-300 font-mono">recruiter@acme.com</strong></span>
                  <button
                    onClick={() => {
                      setEmail('recruiter@acme.com');
                      setPassword('recruiter123');
                      setIsRegistering(false);
                    }}
                    className="text-[9px] text-accentCyan hover:text-zinc-100 font-extrabold uppercase tracking-wide transition-colors"
                  >
                    Autofill
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Portal Route Redirect */}
            <div className="mt-4 pt-4 border-t border-zinc-900/60 text-center">
              <span className="text-[10px] text-zinc-400 block mb-1 font-semibold">Are you a candidate?</span>
              <button
                type="button"
                onClick={() => navigate('/candidate/dashboard')}
                className="text-xs text-accentCyan hover:text-white font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                Go to Candidate Portal &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
