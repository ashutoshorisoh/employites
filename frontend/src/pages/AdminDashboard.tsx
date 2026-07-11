import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/ui/MetricCard';
import {
  Users, Video, Activity, DollarSign, Cpu, Settings,
  RefreshCw, AlertTriangle, ShieldCheck, Lock, Loader2, Eye, EyeOff
} from 'lucide-react';

interface ClientOrg {
  id: string;
  name: string;
  ownerEmail: string;
  plan: 'Starter Tier' | 'Grow Professional' | 'Enterprise Scale' | 'Free Tier';
  seats: number;
  totalSubmissions: number;
  apiTokensUsed: number;
  status: 'active' | 'suspended';
}

export const AdminDashboard: React.FC = () => {
  const { user, loginWithPassword, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clients, setClients] = useState<ClientOrg[]>([
    { id: 'org_1', name: 'Google Recruiter Pool', ownerEmail: 'hr@google.com', plan: 'Enterprise Scale', seats: 45, totalSubmissions: 1240, apiTokensUsed: 984000, status: 'active' },
    { id: 'org_2', name: 'Stripe Acquisition Corp', ownerEmail: 'talent@stripe.com', plan: 'Grow Professional', seats: 8, totalSubmissions: 310, apiTokensUsed: 245000, status: 'active' },
    { id: 'org_3', name: 'Y-Combinator Inc', ownerEmail: 'batch-interviews@ycombinator.com', plan: 'Grow Professional', seats: 12, totalSubmissions: 890, apiTokensUsed: 720000, status: 'active' },
    { id: 'org_4', name: 'Acme HR Labs', ownerEmail: 'admin@acmelabs.io', plan: 'Starter Tier', seats: 2, totalSubmissions: 18, apiTokensUsed: 12500, status: 'active' },
    { id: 'org_5', name: 'CryptoHire Group', ownerEmail: 'shady-recruiter@cryptohire.net', plan: 'Free Tier', seats: 1, totalSubmissions: 5, apiTokensUsed: 4000, status: 'suspended' },
  ]);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsRefreshing(false);
  };

  const toggleClientStatus = (id: string) => {
    setClients(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'active' ? 'suspended' : 'active' };
      }
      return c;
    }));
  };

  // If user is not logged in as Admin, display the secure admin-only sign in page!
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md relative">
          {/* Colorful Glowing Orbs in the background */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-accentPurple/10 blur-3xl -z-10"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-accentCyan/10 blur-3xl -z-10"></div>

          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>

            <div className="mb-6 text-center">
              <h2 className="text-xl font-extrabold text-zinc-100 flex items-center justify-center gap-1.5">
                Owner Workspace <Settings className="w-5 h-5 text-accentPurple animate-spin" style={{ animationDuration: '6s' }} />
              </h2>
              <p className="text-xs text-gray-400 mt-1">Please authenticate with your administrator credentials.</p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200/60 text-xs font-semibold rounded-xl mb-5 text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Owner Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@skreener.ai"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
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
          <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
            Platform Owner Workspace <Settings className="w-5 h-5 text-accentPurple animate-spin" style={{ animationDuration: '6s' }} />
          </h1>
          <p className="text-xs text-gray-400 mt-1">Real-time infrastructure health, telemetry thresholds, and client subscription quotas.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:text-accentPurple transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Sync Metrics
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 bg-zinc-900 hover:bg-rose-50 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-600 rounded-xl border border-zinc-850 hover:border-rose-200 transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Monthly Revenue"
          value="$14,820"
          icon={DollarSign}
          change="+18.2%"
          isPositive={true}
          glowColor="emerald"
        />
        <MetricCard
          title="Active Recruiter Pools"
          value="118 Org Pools"
          icon={Users}
          change="+6.4%"
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

      {/* Client List & Systems Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Clients Table (2 columns wide on large screen) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-md font-bold text-gray-200">Registered Client Organizations</h3>
                <span className="text-[10px] text-zinc-200 uppercase tracking-widest font-semibold">Active Seats Check</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-gray-500 font-bold">
                      <th className="pb-3">Organization Name</th>
                      <th className="pb-3">Plan Tier</th>
                      <th className="pb-3 text-center">Active Seats</th>
                      <th className="pb-3 text-center">Video Submissions</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/10 transition-colors">
                        <td className="py-3.5 pr-2">
                          <span className="font-bold text-gray-200 block">{c.name}</span>
                          <span className="text-[10px] text-gray-500">{c.ownerEmail}</span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded border ${c.plan === 'Enterprise Scale' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' :
                            c.plan === 'Grow Professional' ? 'bg-cyan-50 text-cyan-700 border-cyan-200/60' :
                              c.plan === 'Starter Tier' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                                'bg-zinc-900 text-zinc-200 border-zinc-850'
                            }`}>
                            {c.plan}
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-semibold text-gray-300">{c.seats}</td>
                        <td className="py-3.5 text-center font-semibold text-gray-300">{c.totalSubmissions}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${c.status === 'active' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => toggleClientStatus(c.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${c.status === 'active'
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                          >
                            {c.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
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
            <h3 className="text-md font-bold text-gray-200 mb-4 flex items-center gap-2">
              System Pipeline Health <Activity className="w-4 h-4 text-accentCyan animate-pulse" />
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div>
                  <span className="font-semibold text-gray-300 block">Supabase Connection</span>
                  <span className="text-[10px] text-zinc-200">Database pools & caching</span>
                </div>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% OK
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div>
                  <span className="font-semibold text-gray-300 block">Cloudflare R2 Bucket</span>
                  <span className="text-[10px] text-zinc-200">Direct streaming handshake</span>
                </div>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% OK
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <div>
                  <span className="font-semibold text-gray-300 block">Gemini 1.5 Flash Engine</span>
                  <span className="text-[10px] text-zinc-200">Async structured evaluation API</span>
                </div>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% OK
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPink to-amber-500"></div>
            <h3 className="text-md font-bold text-gray-200 mb-4 flex items-center gap-2">
              System Telemetry Alerts <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            </h3>

            <div className="space-y-3.5 text-[11px] text-gray-400">
              <div className="border-l-2 border-amber-500 pl-3 py-0.5">
                <span className="font-semibold text-gray-200 block">Eye-Tracking Anomaly Flagged</span>
                <span>Candidate candidate_9a2f on Google Recruiter pool triggered alert. Rating: 3/10 integrity.</span>
                <span className="block text-[9px] text-zinc-200 mt-1">14 mins ago</span>
              </div>

              <div className="border-l-2 border-rose-500 pl-3 py-0.5">
                <span className="font-semibold text-gray-200 block">Off-screen Text Reading Flagged</span>
                <span>Candidate candidate_c7b2 on Stripe Acquisition pool triggered alert. Rating: 2/10 integrity.</span>
                <span className="block text-[9px] text-zinc-200 mt-1">45 mins ago</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
