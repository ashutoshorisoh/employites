import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/ui/MetricCard';
import {
  Users, Video, Activity, DollarSign, Cpu, Settings,
  RefreshCw, AlertTriangle, ShieldCheck, Lock, Loader2, Eye, EyeOff, Gift, TrendingUp, Save, CheckCircle, Edit2, X
} from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  tier: string;
  status: string;
  paddle_sub_id: string;
}

interface BillingMetrics {
  mrr: number;
  active_subscribers_count: number;
  subscribers: Subscriber[];
}

export const AdminDashboard: React.FC = () => {
  const { user, loginWithPassword, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const [pricingTiers, setPricingTiers] = useState({
    starter: '',
    professional: '',
    enterprise: ''
  });
  const [pricingDetails, setPricingDetails] = useState({
    starter: { display_price: '', numeric_price: 0 },
    professional: { display_price: '', numeric_price: 0 },
    enterprise: { display_price: '', numeric_price: 0 }
  });
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState('');
  const [pricingErrorMsg, setPricingErrorMsg] = useState('');
  
  const [couponConfig, setCouponConfig] = useState({
    discount_type: 'percentage',
    amount: '20',
    usage_limit: 100
  });
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchMetrics = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/v1/admin/billing/metrics`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch billing metrics', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPricingTiers = async () => {
    setIsPricingLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/admin/billing/pricing-tiers`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // data is now an array: [{ tier, id, numeric_price, display_price }, ...]
        const tiersMap: Record<string, string> = { starter: '', professional: '', enterprise: '' };
        const detailsMap: Record<string, { display_price: string; numeric_price: number }> = {
          starter: { display_price: 'Not Configured', numeric_price: 0 },
          professional: { display_price: 'Not Configured', numeric_price: 0 },
          enterprise: { display_price: 'Not Configured', numeric_price: 0 }
        };
        if (Array.isArray(data)) {
          data.forEach((item: { tier: string; id: string; numeric_price: number; display_price: string }) => {
            if (item.tier in tiersMap) {
              tiersMap[item.tier] = item.id || '';
              detailsMap[item.tier] = {
                display_price: item.display_price || 'Not Configured',
                numeric_price: item.numeric_price || 0
              };
            }
          });
        }
        setPricingTiers(tiersMap as typeof pricingTiers);
        setPricingDetails(detailsMap as typeof pricingDetails);
      }
    } catch (err) {
      console.error('Failed to fetch pricing tiers', err);
    } finally {
      setIsPricingLoading(false);
    }
  };

  const fetchCoupons = async () => {
    setIsCouponsLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/admin/billing/coupons`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setIsCouponsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMetrics();
      fetchPricingTiers();
      fetchCoupons();
    }
  }, [user]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    const res = await loginWithPassword(email, password);
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
    } else if (res.role !== 'admin') {
      logout();
      setErrorMsg('Access denied. Administrator privileges required.');
    }
  };

  const generateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/admin/billing/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(couponConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setCouponCode(data.code);
        fetchCoupons();
      }
    } catch (err) {
      console.error('Failed to generate coupon', err);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPricing(true);
    setPricingSuccessMsg('');
    setPricingErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/v1/admin/billing/pricing-tiers`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(pricingTiers)
      });
      if (res.ok) {
        setPricingSuccessMsg('Configuration updated!');
        setEditingTier(null);
        setTimeout(() => setPricingSuccessMsg(''), 3000);
        await fetchPricingTiers();
      } else {
        const errData = await res.json();
        setPricingErrorMsg(errData.detail || 'Validation failed');
        setTimeout(() => setPricingErrorMsg(''), 8000);
      }
    } catch (err) {
      console.error('Failed to save pricing', err);
      setPricingErrorMsg('Network error occurred.');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const toggleClientStatus = (id: string) => {
    if (!metrics) return;
    setMetrics({
      ...metrics,
      subscribers: metrics.subscribers.map(sub => {
        if (sub.id === id) {
          return { ...sub, status: sub.status === 'active' ? 'suspended' : 'active' };
        }
        return sub;
      })
    });
  };

  const chartData = [10, 25, 40, 60, 75, 90, 118];
  const maxVal = Math.max(...chartData);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md relative">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-accentPurple/10 blur-3xl -z-10"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-accentCyan/10 blur-3xl -z-10"></div>

          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>

            <div className="mb-6 text-center">
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center justify-center gap-1.5">
                Owner Workspace <Settings className="w-5 h-5 text-accentPurple animate-spin" style={{ animationDuration: '6s' }} />
              </h2>
              <p className="text-xs text-slate-300 mt-1">Please authenticate with your administrator credentials.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200/60 text-xs font-semibold rounded-xl mb-5 text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Owner Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@skreener.ai"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-700 focus:border-accentPurple/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-700 focus:border-accentPurple/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="glow-btn w-full py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Owner...
                  </>
                ) : (
                  'Enter Owner Console'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            EmployitesOwner Workspace <Settings className="w-5 h-5 text-accentPurple animate-spin" style={{ animationDuration: '6s' }} />
          </h1>
          <p className="text-xs text-slate-300 mt-1">Real-time infrastructure health, telemetry thresholds, and client subscription quotas.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { fetchMetrics(); fetchPricingTiers(); }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-100 hover:text-accentPurple transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Metrics
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-900 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-rose-600 rounded-xl border border-slate-700 hover:border-rose-200 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Monthly Revenue"
          value={`$${(metrics?.mrr || 0).toLocaleString()}`}
          icon={DollarSign}
          change="Live Data"
          isPositive={true}
          glowColor="emerald"
        />
        <MetricCard
          title="Active Recruiter Pools"
          value={`${metrics?.active_subscribers_count || 0} Pools`}
          icon={Users}
          change="Live Data"
          isPositive={true}
          glowColor="cyan"
        />
        <MetricCard
          title="Video Ingest Volume"
          value="2,465 Screenings"
          icon={Video}
          change="+34.8%"
          isPositive={true}
          glowColor="purple"
        />
        <MetricCard
          title="Gemini Evaluation Cost"
          value="$142.80"
          icon={Cpu}
          change="-4.2% optimized"
          isPositive={true}
          glowColor="pink"
        />
      </div>

      {/* Middle Graph & Paddle Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        
        {/* Growth Visual Chart (SVG based) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple via-accentCyan to-transparent"></div>
          <div>
            <h3 className="text-md font-bold text-slate-900 mb-1 flex items-center gap-2">
              Subscriber Growth <TrendingUp className="w-4 h-4 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-500 mb-6">Month-over-month active organizational subscriptions.</p>
          </div>
          
          <div className="flex-1 w-full h-full relative">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="10" x2="100" y2="10" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.5"/>
              <line x1="0" y1="20" x2="100" y2="20" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.5"/>
              <line x1="0" y1="30" x2="100" y2="30" stroke="#cbd5e1" strokeWidth="0.2" strokeDasharray="1,1" opacity="0.5"/>
              
              {/* Line graph */}
              <polyline
                fill="none"
                stroke="#06b6d4" /* accentCyan */
                strokeWidth="1.5"
                points={chartData.map((val, i) => `${(i / (chartData.length - 1)) * 100},${40 - (val / maxVal) * 35}`).join(' ')}
              />
              
              {/* Data points */}
              {chartData.map((val, i) => (
                <circle
                  key={i}
                  cx={(i / (chartData.length - 1)) * 100}
                  cy={40 - (val / maxVal) * 35}
                  r="1.5"
                  fill="#c084fc" /* accentPurple */
                  stroke="#fff"
                  strokeWidth="0.5"
                />
              ))}
              
              {/* Gradient Area under line */}
              <polygon
                fill="url(#gradient)"
                opacity="0.2"
                points={`0,40 ${chartData.map((val, i) => `${(i / (chartData.length - 1)) * 100},${40 - (val / maxVal) * 35}`).join(' ')} 100,40`}
              />
              
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[9px] text-slate-500 uppercase font-semibold px-2">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
            </div>
          </div>
        </div>

        {/* Global Plan Pricing Management */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentCyan to-emerald-400"></div>
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-md font-bold text-slate-100 mb-1 flex items-center gap-2">
                Pricing Management <DollarSign className="w-4 h-4 text-slate-100" />
              </h3>
              <p className="text-xs text-slate-300">Configure active Paddle Price IDs for tier mapping.</p>
            </div>
          </div>
          
          {isPricingLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-2" />
              <p className="text-[10px] text-slate-300">Loading active mappings...</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3">
              {/* Free Tier */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Free Tier</label>
                <div className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-medium text-xs flex items-center justify-between">
                  <span>Free Plan — 10 AI Interviews (Server Managed)</span>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Starter Tier */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Starter Tier</label>
                {editingTier === 'starter' ? (
                  <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-100">Starter Tier Plan</span>
                      <span className="text-[10px] text-emerald-600">{pricingDetails.starter.display_price}</span>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <span className="absolute left-3 text-slate-500 font-bold">$</span>
                      <input 
                        type="number" 
                        value={pricingTiers.starter} 
                        onChange={(e) => setPricingTiers(prev => ({ ...prev, starter: e.target.value }))} 
                        className="flex-1 pl-7 pr-3 py-1.5 bg-white border border-slate-700 focus:border-emerald-500 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all text-xs font-bold"
                        placeholder="199"
                      />
                      <button onClick={handleSavePricing} disabled={isSavingPricing} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1">
                        {isSavingPricing && editingTier === 'starter' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update'}
                      </button>
                      <button onClick={() => { setEditingTier(null); setPricingErrorMsg(''); }} className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-600 text-xs font-semibold flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-slate-100">Starter Tier Plan</span>
                      <span className="text-[10px] text-emerald-600 mt-0.5">{pricingDetails.starter.display_price}</span>
                    </div>
                    <button onClick={() => { 
                        setEditingTier('starter'); 
                        setPricingErrorMsg(''); 
                        setPricingTiers(prev => ({ ...prev, starter: String(pricingDetails.starter.numeric_price || '') }));
                      }} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100 bg-slate-800 rounded">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Professional Tier */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Professional Tier</label>
                {editingTier === 'professional' ? (
                  <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-100">Professional Tier Plan</span>
                      <span className="text-[10px] text-cyan-600">{pricingDetails.professional.display_price}</span>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <span className="absolute left-3 text-slate-500 font-bold">$</span>
                      <input 
                        type="number" 
                        value={pricingTiers.professional} 
                        onChange={(e) => setPricingTiers(prev => ({ ...prev, professional: e.target.value }))} 
                        className="flex-1 pl-7 pr-3 py-1.5 bg-white border border-slate-700 focus:border-cyan-500 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all text-xs font-bold"
                        placeholder="199"
                      />
                      <button onClick={handleSavePricing} disabled={isSavingPricing} className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1">
                        {isSavingPricing && editingTier === 'professional' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update'}
                      </button>
                      <button onClick={() => { setEditingTier(null); setPricingErrorMsg(''); }} className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-cyan-600 text-xs font-semibold flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-slate-100">Professional Tier Plan</span>
                      <span className="text-[10px] text-cyan-600 mt-0.5">{pricingDetails.professional.display_price}</span>
                    </div>
                    <button onClick={() => { 
                        setEditingTier('professional'); 
                        setPricingErrorMsg(''); 
                        setPricingTiers(prev => ({ ...prev, professional: String(pricingDetails.professional.numeric_price || '') }));
                      }} className="p-1 text-slate-400 hover:text-cyan-600 transition-colors opacity-0 group-hover:opacity-100 bg-slate-800 rounded">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Enterprise Tier */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Enterprise Tier</label>
                {editingTier === 'enterprise' ? (
                  <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-100">Enterprise Tier Plan</span>
                      <span className="text-[10px] text-indigo-600">{pricingDetails.enterprise.display_price}</span>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <span className="absolute left-3 text-slate-500 font-bold">$</span>
                      <input 
                        type="number" 
                        value={pricingTiers.enterprise} 
                        onChange={(e) => setPricingTiers(prev => ({ ...prev, enterprise: e.target.value }))} 
                        className="flex-1 pl-7 pr-3 py-1.5 bg-white border border-slate-700 focus:border-indigo-500 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all text-xs font-bold"
                        placeholder="199"
                      />
                      <button onClick={handleSavePricing} disabled={isSavingPricing} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1">
                        {isSavingPricing && editingTier === 'enterprise' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update'}
                      </button>
                      <button onClick={() => { setEditingTier(null); setPricingErrorMsg(''); }} className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-indigo-600 text-xs font-semibold flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="text-slate-100">Enterprise Tier Plan</span>
                      <span className="text-[10px] text-indigo-600 mt-0.5">{pricingDetails.enterprise.display_price}</span>
                    </div>
                    <button onClick={() => { 
                        setEditingTier('enterprise'); 
                        setPricingErrorMsg(''); 
                        setPricingTiers(prev => ({ ...prev, enterprise: String(pricingDetails.enterprise.numeric_price || '') }));
                      }} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 bg-slate-800 rounded">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {pricingErrorMsg && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[10px] text-rose-400 font-semibold mt-1">
                  {pricingErrorMsg}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Paddle Operations Block */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPink to-accentPurple"></div>
          <h3 className="text-md font-bold text-slate-100 mb-1 flex items-center gap-2">
            Billing Operations <Gift className="w-4 h-4 text-accentPink" />
          </h3>
          <p className="text-xs text-slate-300 mb-6">Manage Paddle configurations and generate dynamic promo codes.</p>
          
          <div className="space-y-4 flex-1">
            <form onSubmit={generateCoupon} className="bg-slate-900 p-4 border border-slate-700 rounded-xl">
              <span className="font-semibold text-slate-100 block text-xs mb-1">Coupon Generation</span>
              <p className="text-[10px] text-slate-300 mb-3">Create single-use custom discount links via Paddle SDK.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[9px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Discount Type</label>
                  <select 
                    value={couponConfig.discount_type}
                    onChange={(e) => setCouponConfig(prev => ({ ...prev, discount_type: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-700 focus:border-accentPink rounded-md text-slate-100 focus:outline-none transition-all text-xs"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Value / Amount</label>
                  <input 
                    type="number"
                    value={couponConfig.amount}
                    onChange={(e) => setCouponConfig(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-700 focus:border-accentPink rounded-md text-slate-100 focus:outline-none transition-all text-xs"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Max Usage Limit</label>
                  <input 
                    type="number"
                    value={couponConfig.usage_limit}
                    onChange={(e) => setCouponConfig(prev => ({ ...prev, usage_limit: parseInt(e.target.value) || 1 }))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-700 focus:border-accentPink rounded-md text-slate-100 focus:outline-none transition-all text-xs"
                    min="1"
                    required
                  />
                </div>
              </div>

              {couponCode ? (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between mt-2">
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-700">Success!</p>
                  </div>
                  <div className="bg-emerald-50 px-2 py-1 rounded text-xs font-mono text-emerald-800 border border-emerald-200">
                    {couponCode}
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-accentPurple to-accentPink text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 glow-btn mt-2"
                >
                  {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                  Generate Coupon
                </button>
              )}
            </form>

            <div className="bg-slate-900 p-4 border border-slate-700 rounded-xl">
              <span className="font-semibold text-slate-100 block text-xs mb-1">Environment Sync</span>
              <p className="text-[10px] text-slate-300 mb-3">Restore mapping definitions from ENV.</p>
              <button
                onClick={() => {
                  setPricingTiers({ starter: '', professional: '', enterprise: '' });
                  fetchPricingTiers();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-lg text-xs font-semibold transition-all border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reload Config
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Active Coupon Promotions Ledger */}
      <div className="glass-panel rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 to-rose-500"></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-md font-bold text-slate-100">Active Coupon Promotions Ledger</h3>
          <button 
            onClick={fetchCoupons} 
            disabled={isCouponsLoading}
            className="text-[10px] flex items-center gap-1 text-slate-350 hover:text-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isCouponsLoading ? 'animate-spin' : ''}`} /> Sync Ledger
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300 font-bold">
                <th className="pb-3 px-2">Coupon Key / Promo Code</th>
                <th className="pb-3 px-2">Discount Value</th>
                <th className="pb-3 px-2">Usage Tracker</th>
                <th className="pb-3 px-2 text-right">Status Badge</th>
              </tr>
            </thead>
            <tbody>
              {isCouponsLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
                  </td>
                </tr>
              ) : coupons.length > 0 ? (
                coupons.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-2 font-mono text-slate-100 font-semibold">{c.description || c.id}</td>
                    <td className="py-3 px-2 text-slate-300 capitalize">
                      {c.type === 'percentage' ? `${c.amount}% Off` : `$${c.amount} Off`}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200">{c.times_used} / {c.usage_limit || '∞'}</span>
                        <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accentPink" 
                            style={{ width: c.usage_limit ? `${Math.min((c.times_used / c.usage_limit) * 100, 100)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        c.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-300">
                    No active promotional coupons found on gateway.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client List & Systems Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Clients Table (2 columns wide on large screen) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-bold text-slate-100">Registered Client Organizations</h3>
                <span className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">Active Subscriptions</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-300 font-bold">
                      <th className="pb-3">Organization Email</th>
                      <th className="pb-3">Plan Tier</th>
                      <th className="pb-3">Paddle ID</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.subscribers && metrics.subscribers.length > 0 ? (
                      metrics.subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors">
                          <td className="py-3.5 pr-2">
                            <span className="font-bold text-slate-100 block truncate max-w-[200px]">{sub.email}</span>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded border capitalize ${sub.tier === 'enterprise' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              sub.tier === 'professional' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                sub.tier === 'starter' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  'bg-slate-900 text-slate-300 border-slate-700'
                              }`}>
                              {sub.tier}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono text-[10px] text-slate-300">
                            {sub.paddle_sub_id}
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${sub.status === 'active' ? 'text-emerald-700' : 'text-amber-700'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => toggleClientStatus(sub.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${sub.status === 'active'
                                ? 'border-amber-250 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-250 text-emerald-700 hover:bg-emerald-50'
                                }`}
                            >
                              {sub.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-300">
                          No active organizational subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Systems Diagnostics / Telemetry Flags */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentCyan to-accentPurple"></div>
            <h3 className="text-md font-bold text-slate-100 mb-4 flex items-center gap-2">
              System Pipeline Health <Activity className="w-4 h-4 text-accentCyan animate-pulse" />
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div>
                  <span className="font-semibold text-slate-100 block">Supabase Connection</span>
                  <span className="text-[10px] text-slate-300">Database pools & caching</span>
                </div>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% OK
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div>
                  <span className="font-semibold text-slate-100 block">Cloudflare R2 Bucket</span>
                  <span className="text-[10px] text-slate-300">Direct streaming handshake</span>
                </div>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% OK
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div>
                  <span className="font-semibold text-slate-100 block">Gemini 1.5 Flash Engine</span>
                  <span className="text-[10px] text-slate-300">Async structured evaluation API</span>
                </div>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% OK
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPink to-amber-500"></div>
            <h3 className="text-md font-bold text-slate-100 mb-4 flex items-center gap-2">
              System Telemetry Alerts <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            </h3>

            <div className="space-y-3.5 text-[11px] text-slate-300">
              <div className="border-l-2 border-amber-500 pl-3 py-0.5">
                <span className="font-semibold text-slate-100 block">Eye-Tracking Anomaly Flagged</span>
                <span>Candidate candidate_9a2f on Google Recruiter pool triggered alert. Rating: 3/10 integrity.</span>
                <span className="block text-[9px] text-slate-400 mt-1">14 mins ago</span>
              </div>

              <div className="border-l-2 border-rose-500 pl-3 py-0.5">
                <span className="font-semibold text-slate-100 block">Off-screen Text Reading Flagged</span>
                <span>Candidate candidate_c7b2 on Stripe Acquisition pool triggered alert. Rating: 2/10 integrity.</span>
                <span className="block text-[9px] text-slate-400 mt-1">45 mins ago</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
