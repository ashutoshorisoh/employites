import React, { useEffect, useState } from 'react';
import { Shield, Users, CreditCard, Gift, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

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

export const AdminBillingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/v1/admin/billing/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Failed to fetch billing metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const generateCoupon = async () => {
    setCouponLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/v1/admin/billing/coupons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCouponCode(data.code);
      }
    } catch (err) {
      console.error('Failed to generate coupon', err);
    } finally {
      setCouponLoading(false);
    }
  };

  const syncPricing = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/v1/admin/billing/pricing-tiers`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success("Pricing tiers synchronized with server.");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-accentPurple" />
              Billing Administration
            </h1>
            <p className="text-zinc-500 mt-2">Manage Paddle subscriptions, view MRR, and generate promotional coupons.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={syncPricing}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Sync Pricing Tiers
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-accentPurple animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Total MRR</p>
                  <p className="text-4xl font-extrabold text-zinc-900 mt-2">${metrics?.mrr || 0}</p>
                </div>
                <div className="w-16 h-16 bg-accentCyan/10 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-accentCyan" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Active Subscribers</p>
                  <p className="text-4xl font-extrabold text-zinc-900 mt-2">{metrics?.active_subscribers_count || 0}</p>
                </div>
                <div className="w-16 h-16 bg-accentPurple/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-accentPurple" />
                </div>
              </div>
            </div>

            {/* Coupons Generation Section */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Promotional Coupons</h3>
                  <p className="text-sm text-zinc-500 mt-1">Generate a dynamic coupon code using the Paddle SDK.</p>
                </div>
                <button
                  onClick={generateCoupon}
                  disabled={couponLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accentPurple to-accentPink text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 glow-btn"
                >
                  {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                  Generate Coupon
                </button>
              </div>
              {couponCode && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-800">Coupon Generated Successfully!</p>
                    <p className="text-xs text-green-600 mt-0.5">This code can be applied at checkout.</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg border border-green-300 font-mono text-green-700 font-bold tracking-wider">
                    {couponCode}
                  </div>
                </div>
              )}
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-zinc-200">
                <h3 className="text-lg font-bold text-zinc-900">Recent Subscribers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tier</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Paddle ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {metrics?.subscribers && metrics.subscribers.length > 0 ? (
                      metrics.subscribers.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">{sub.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 capitalize">{sub.tier}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-500">{sub.paddle_sub_id}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-zinc-500">
                          No active subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
