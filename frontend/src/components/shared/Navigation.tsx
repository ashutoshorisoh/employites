import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Video, LogOut, CreditCard, Menu, X, Key, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const isRecruiter = user?.role === 'recruiter';
  const isCandidate = user?.role === 'candidate';
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-zinc-900 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Brand/Logo (Left Side) */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accentPurple to-accentCyan flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
            <Video className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-zinc-100">
              Employites
            </span>
            <span className="block text-[9px] font-bold text-accentCyan tracking-widest uppercase">Async Interviews</span>
          </div>
        </div>

        {/* Desktop Navigation & Actions (All aligned to the Right Side) */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {/* Guest (Unauthenticated) Navigation Links */}
          {!user && (
            <>
              <button
                onClick={() => navigate('/pricing')}
                className={`text-xs font-bold tracking-wider uppercase transition-colors ${isActive('/pricing') ? 'text-accentPurple' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
              >
                Pricing
              </button>
              <button
                onClick={() => navigate('/login', { state: { register: false } })}
                className={`text-xs font-bold tracking-wider uppercase transition-colors ${isActive('/login') && !location.state?.register ? 'text-accentPurple' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/login', { state: { register: true } })}
                className="px-4 py-2 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-accentPurple/25 transition-all glow-btn"
              >
                Register
              </button>
            </>
          )}

          {/* Authenticated Users */}
          {user && (
            <>
              {/* Admin Navigation */}
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className={`text-xs font-bold tracking-wider uppercase transition-colors ${isActive('/admin') ? 'text-accentPurple' : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                >
                  Admin Hub
                </button>
              )}

              {/* Candidate Navigation */}
              {isCandidate && (
                <button
                  onClick={() => navigate('/interview')}
                  className={`text-xs font-bold tracking-wider uppercase transition-colors ${isActive('/interview') ? 'text-accentPurple' : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                >
                  Interview Portal
                </button>
              )}

              {/* Recruiter Navigation */}
              {isRecruiter && (
                <>
                  <button
                    onClick={() => navigate('/recruiter')}
                    className={`text-xs font-bold tracking-wider uppercase transition-colors ${isActive('/recruiter') ? 'text-accentPurple' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/pricing')}
                    className={`text-xs font-bold tracking-wider uppercase transition-colors ${isActive('/pricing') ? 'text-accentPurple' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-accentPurple/30 text-xs font-bold text-zinc-300 hover:text-accentPurple rounded-xl transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {user.is_subscribed ? 'Upgrade Plan' : 'Buy Plan'}
                  </button>
                </>
              )}

              {/* User Identity Column & Logout Control */}
              <div className="flex items-center gap-4 pl-4 border-l border-zinc-800">
                <div className="text-right">
                  <span className="block text-xs font-bold text-zinc-100 truncate max-w-[150px]">{user.name || user.email}</span>
                  <span className={`inline-block text-[9px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded mt-0.5 border ${isAdmin ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                      isRecruiter ? 'bg-cyan-50 text-cyan-600 border-cyan-200' :
                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-zinc-950/40 border border-zinc-900 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 rounded-xl"
        >
          {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-3">
          {user && (
            <>
              {/* Profile Details */}
              <div className="px-3 py-2 bg-zinc-950/30 border border-zinc-900 rounded-lg flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-zinc-100">{user.name || user.email}</div>
                  <div className="text-[10px] text-zinc-200 capitalize">{user.role} tier</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-rose-600"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Admin Links */}
              {isAdmin && (
                <button
                  onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-100"
                >
                  Admin Hub
                </button>
              )}

              {/* Recruiter Links */}
              {isRecruiter && (
                <>
                  <button
                    onClick={() => { navigate('/recruiter'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2.5 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-100"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2.5 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-100"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2.5 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-accentPurple flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    {user.is_subscribed ? 'Upgrade Plan' : 'Buy Plan'}
                  </button>
                </>
              )}

              {/* Candidate Links */}
              {isCandidate && (
                <button
                  onClick={() => { navigate('/interview'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-100"
                >
                  Interview Portal
                </button>
              )}
            </>
          )}

          {/* Guest Links */}
          {!user && (
            <>
              <button
                onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
                className="w-full text-left py-2.5 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-100"
              >
                Pricing
              </button>
              <button
                onClick={() => { navigate('/login', { state: { register: false } }); setMobileMenuOpen(false); }}
                className="w-full text-left py-2.5 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-100"
              >
                Login
              </button>
              <button
                onClick={() => { navigate('/login', { state: { register: true } }); setMobileMenuOpen(false); }}
                className="w-full py-2.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-lg text-center"
              >
                Register
              </button>
            </>
          )}
        </div>
      )}

    </nav>
  );
};
