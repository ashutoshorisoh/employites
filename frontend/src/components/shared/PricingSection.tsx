import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Building2, ArrowRight, Star, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    Paddle?: any;
  }
}

interface PricingSectionProps {
  onSuccess?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const isRecruiter = user?.role === 'recruiter';
  const isSubscribed = user?.is_subscribed;
  const [pricingData, setPricingData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

  useEffect(() => {
    // Fetch pricing tiers
    setIsLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/v1/admin/billing/pricing-tiers`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load pricing configuration (HTTP ${res.status}).`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || Object.keys(data).length === 0) {
          throw new Error("Received empty pricing tiers mapping from server.");
        }
        setPricingData(data);
      })
      .catch(err => {
        console.error('Failed to load pricing config', err);
        setError('Billing Gateway connection failed. Please ensure the backend is available.');
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Initialize Paddle SDK
    if (!window.Paddle) {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v3/paddle.js';
      script.async = true;
      script.onload = () => {
        const clientToken = (
          (import.meta.env && import.meta.env.VITE_PADDLE_CLIENT_TOKEN) ||
          (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) ||
          ""
        ).trim();

        const isSandbox = !clientToken || clientToken.includes('test_') || clientToken.includes('sandbox');

        if (window.Paddle) {
          window.Paddle.Initialize({
            token: clientToken || 'test_dummy_client_token',
            environment: isSandbox ? 'sandbox' : 'production'
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  const handleCheckout = (priceId: string) => {
    if (!priceId) return;
    if (window.Paddle) {
      window.Paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en"
        },
        customData: {
          workspace_id: user?.id
        }
      });
    }
  };

  const tiers = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal for small squads',
      price: '$79',
      interviews: '120 AI interviews',
      period: '/mo',
      highlight: false,
      features: [
        '120 AI interviews / month',
        'Unlimited active job listings',
        'Advanced AI scoring & summaries',
        'Standard anti-cheat logging',
        'Email & community support',
      ],
      icon: Zap,
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Perfect for growing teams',
      price: '$139',
      interviews: '200 AI interviews',
      period: '/mo',
      highlight: true,
      badge: 'Most Popular',
      features: [
        '200 AI interviews / month',
        'Custom AI evaluation rubrics',
        'Export reports (CSV & PDF)',
        'Full anti-cheat suite & telemetry',
        'Candidate leaderboard ranking',
        'Priority support reply',
      ],
      icon: Sparkles,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Built for high volume hiring',
      price: '$200',
      interviews: '300 AI interviews',
      period: '/mo',
      highlight: false,
      features: [
        '300 AI interviews / month',
        'Direct API endpoints access',
        'SSO & SAML integration',
        'Custom branding & white-label',
        'Dedicated platform owner support',
        '99.9% SLA uptime guarantee',
      ],
      icon: Building2,
    },
  ];

  const handleAction = () => {
    if (!user) {
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <Loader2 className="w-10 h-10 text-accentPurple animate-spin mb-4" />
        <p className="text-sm text-zinc-400 font-medium animate-pulse">Loading pricing tiers & live configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-zinc-950/80 border border-red-500/30 rounded-2xl text-center backdrop-blur-md shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
        <div className="inline-flex p-3.5 rounded-full bg-red-500/10 text-red-400 mb-4 ring-1 ring-red-500/20">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-zinc-150 mb-2">Billing Gateway Offline</h3>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 shadow-lg shadow-red-950/20 hover:shadow-red-950/40 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ─── Billing Toggle ─── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-900/60 border border-zinc-800/50 rounded-full">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${billingCycle === 'monthly'
                ? 'bg-accentPurple text-white shadow-lg shadow-accentPurple/25'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-1.5 ${billingCycle === 'annual'
                ? 'bg-accentPurple text-white shadow-lg shadow-accentPurple/25'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Annual
            <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* ─── Pricing Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          
          let displayPrice = tier.price;
          let priceId = '';
          
          const tokenMap: Record<string, string> = {
            starter: 'pri_01kxa0g1a38c47g44k85g3r5fc',
            professional: 'pri_01kxa0hdm56j461bn4y8q9q2g4',
            enterprise: 'pri_01kxa0k9z4t626r7rfem9v976y',
          };
          const expectedToken = tokenMap[tier.id];

          if (pricingData) {
            // Find by matching Price ID token explicitly
            let data = Object.values(pricingData).find(
              (item: any) => item && item.id === expectedToken
            );
            
            // Fallback: match by tier key
            if (!data && pricingData[tier.id]) {
              data = pricingData[tier.id];
            }

            if (data) {
              priceId = data.id || expectedToken;
              if (data.display_price) {
                // If annual is selected, compute 20% discount on the backend display price
                if (billingCycle === 'annual') {
                  const amountMatch = data.display_price.match(/\d+(\.\d+)?/);
                  if (amountMatch) {
                    const parsedVal = parseFloat(amountMatch[0]);
                    const discounted = Math.round(parsedVal * 0.8);
                    displayPrice = `$${discounted}`;
                  } else {
                    displayPrice = data.display_price;
                  }
                } else {
                  displayPrice = data.display_price;
                }
              }
            }
          }

          if (!priceId) {
            priceId = expectedToken;
            const originalPrice = parseInt(tier.price.replace(/\D/g, ''));
            displayPrice = billingCycle === 'annual'
              ? `$${Math.round(originalPrice * 0.8)}`
              : tier.price;
          }

          // Spacing and Typography cleanup check
          const hasBillingCycle = displayPrice.includes('/') || 
                                  displayPrice.toLowerCase().includes('month') || 
                                  displayPrice.toLowerCase().includes('mo') ||
                                  displayPrice.toLowerCase().includes('year') ||
                                  displayPrice.toLowerCase().includes('annual');

          // Determine button text based on user subscription state
          let btnText = 'Start Free Trial';
          if (!user) {
            btnText = 'Sign Up to Start';
          } else if (isRecruiter) {
            btnText = isSubscribed ? 'Upgrade Plan' : 'Buy Plan';
          } else {
            btnText = 'Recruiter Plan';
          }

          return (
            <div
              key={tier.id}
              className={`group relative rounded-2xl flex flex-col transition-all duration-500 ${
                tier.highlight ? 'md:-mt-3 md:mb-[-12px] scale-[1.02] md:scale-[1.03] z-10' : ''
              }`}
            >
              {/* Border decoration */}
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-accentPurple via-accentPurple/40 to-accentCyan p-[2px] shadow-2xl shadow-accentPurple/10'
                    : 'bg-zinc-800/80 p-[1px] group-hover:bg-gradient-to-b group-hover:from-accentPurple/45 group-hover:via-zinc-700/50'
                }`}
              >
                <div className="w-full h-full rounded-2xl bg-zinc-950/95 backdrop-blur-md"></div>
              </div>

              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                  <div className="px-4 py-1 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-accentPurple/30 flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />
                    {tier.badge}
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="relative z-10 rounded-2xl p-6 sm:p-7 lg:p-8 flex flex-col flex-1">
                {/* Icon + Name + Description */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        tier.highlight
                          ? 'bg-accentPurple/20 ring-1 ring-accentPurple/40'
                          : 'bg-zinc-900 ring-1 ring-zinc-800 group-hover:bg-accentPurple/15 group-hover:ring-accentPurple/30'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors duration-300 ${
                          tier.highlight ? 'text-accentPurple' : 'text-zinc-400 group-hover:text-accentPurple'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-100">{tier.name}</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{tier.description}</p>
                    </div>
                  </div>
                </div>

                {/* Price & Interview Count */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-extrabold text-zinc-50 tracking-tight">
                      {displayPrice}
                    </span>
                    {!hasBillingCycle && (
                      <span className="text-sm text-zinc-300 font-medium">
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-accentPurple font-semibold mt-2.5">
                    {tier.interviews}
                  </p>
                  {billingCycle === 'annual' && (
                    <p className="text-[11px] text-green-400 mt-1 font-medium">
                      Billed annually · Save 20%
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div
                  className={`h-px mb-6 ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-transparent via-accentPurple/30 to-transparent'
                      : 'bg-zinc-800/60'
                  }`}
                ></div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          tier.highlight
                            ? 'bg-accentPurple/25'
                            : 'bg-zinc-800/80 group-hover:bg-accentPurple/15'
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 transition-colors duration-300 ${
                            tier.highlight
                              ? 'text-accentPurple'
                              : 'text-zinc-200 group-hover:text-accentPurple/85'
                          }`}
                        />
                      </div>
                      <span className="leading-snug text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {user && isRecruiter && !isSubscribed ? (
                  <button
                    onClick={() => handleCheckout(priceId)}
                    disabled={!priceId}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white hover:shadow-xl hover:shadow-accentPurple/25 hover:-translate-y-0.5 glow-btn'
                        : 'bg-zinc-850 text-zinc-300 hover:bg-accentPurple hover:text-white border border-zinc-700/50 hover:border-accentPurple/30 hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    {btnText}
                  </button>
                ) : (
                  <button
                    disabled={!!(user && !isRecruiter)}
                    onClick={handleAction}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white hover:shadow-xl hover:shadow-accentPurple/25 hover:-translate-y-0.5 glow-btn'
                        : 'bg-zinc-850 text-zinc-300 hover:bg-accentPurple hover:text-white border border-zinc-700/50 hover:border-accentPurple/30 hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    {btnText}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
