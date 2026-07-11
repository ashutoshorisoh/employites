import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PaddleCheckout } from './PaddleCheckout';
import { Video, Shield, User as UserIcon, LogOut, CreditCard, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPaddleOpen, setIsPaddleOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUpgradeSuccess = (planName: string) => {
    console.log(`Recruiter successfully upgraded to ${planName}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-40 border-b border-zinc-900 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand/Logo */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accentPurple to-accentCyan flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
            <Video className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-zinc-400 bg-clip-text text-transparent">
              Employites
            </span>
            <span className="block text-[9px] font-bold text-accentCyan tracking-widest uppercase">Async Interviews</span>
          </div>
        </div>

        {/* Desktop Navigation Link Groups based on user roles */}
        <div className="hidden md:flex items-center gap-6">
          {user && (
            <>
              {user.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className={`text-xs font-bold tracking-wider uppercase transition-colors ${
                    isActive('/admin') ? 'text-accentPurple' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Admin Hub
                </button>
              )}

              {user.role === 'recruiter' && (
                <>
                  <button 
                    onClick={() => navigate('/recruiter')}
                    className={`text-xs font-bold tracking-wider uppercase transition-colors ${
                      isActive('/recruiter') ? 'text-accentPurple' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setIsPaddleOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-accentPurple/30 text-xs font-semibold text-zinc-300 hover:text-accentPurple rounded-lg transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Upgrade Seats
                  </button>
                </>
              )}

              {user.role === 'candidate' && (
                <button 
                  onClick={() => navigate('/interview')}
                  className={`text-xs font-bold tracking-wider uppercase transition-colors ${
                    isActive('/interview') ? 'text-accentPurple' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Interview Screen
                </button>
              )}
            </>
          )}
        </div>

        {/* Profile & Auth Control */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-zinc-900">
              <div className="text-right">
                <span className="block text-xs font-bold text-gray-200">{user.name || user.email}</span>
                <span className={`inline-block text-[9px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded mt-0.5 border ${
                  user.role === 'admin' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20' :
                  user.role === 'recruiter' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20' :
                  'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
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
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="glow-btn px-4.5 py-2 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900/60 rounded-xl"
        >
          {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-zinc-900 flex flex-col gap-3">
          {user && (
            <>
              <div className="px-2 py-1 bg-zinc-950/30 border border-zinc-900 rounded-lg flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-gray-300">{user.name || user.email}</div>
                  <div className="text-[10px] text-zinc-500 capitalize">{user.role} tier</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-rose-400"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>

              {user.role === 'admin' && (
                <button 
                  onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-gray-300"
                >
                  Admin Hub
                </button>
              )}

              {user.role === 'recruiter' && (
                <>
                  <button 
                    onClick={() => { navigate('/recruiter'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-gray-300"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setIsPaddleOpen(true); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-accentCyan flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" /> Upgrade Seats
                  </button>
                </>
              )}

              {user.role === 'candidate' && (
                <button 
                  onClick={() => { navigate('/interview'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2 px-3 hover:bg-zinc-900 rounded-lg text-xs font-bold text-gray-300"
                >
                  Interview Screen
                </button>
              )}
            </>
          )}

          {!user && (
            <button
              onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
              className="w-full py-2 bg-accentPurple text-white text-xs font-bold rounded-lg text-center"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      <PaddleCheckout 
        isOpen={isPaddleOpen} 
        onClose={() => setIsPaddleOpen(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </nav>
  );
};
