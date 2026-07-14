import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Building2, ArrowRight, Star, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { initPaddle, getPaddlePrices, STARTER_PRICE_ID, PROFESSIONAL_PRICE_ID, ENTERPRISE_PRICE_ID, ANNUAL_STARTER_PRICE_ID, ANNUAL_PROFESSIONAL_PRICE_ID, ANNUAL_ENTERPRISE_PRICE_ID } from '../../services/getPricing';

interface PricingSectionProps {
  onSuccess?: () => void;
}

interface PricingPlanDisplay {
  tier: string;
  priceId: string;
  displayPrice: string;
  name: string;
  description: string;
  interviews: string;
  highlight: boolean;
  badge?: string;
  features: string[];
  icon: typeof Zap;
}

// Static metadata (features, descriptions)
const PLAN_META: Record<string, {
  name: string;
  description: string;
  interviews: string;
  highlight: boolean;
  badge?: string;
  features: string[];
  icon: typeof Zap;
}> = {
  starter: {
    name: 'Starter',
    description: 'Ideal for small squads',
    interviews: '120 AI interviews',
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
  professional: {
    name: 'Professional',
    description: 'Perfect for growing teams',
    interviews: '200 AI interviews',
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
  enterprise: {
    name: 'Enterprise',
    description: 'Built for high volume hiring',
    interviews: '300 AI interviews',
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
};

const PLAN_ORDER = ['starter', 'professional', 'enterprise'];

export const PricingSectionNew: React.FC<PricingSectionProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isRecruiter = user?.role === 'recruiter';
  const isSubscribed = user?.is_subscribed;
  const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

  // Define static fallback Price IDs matching backend config
  const priceIds: Record<'monthly' | 'annual', Record<string, string>> = {
    monthly: {
      starter: STARTER_PRICE_ID || 'pri_01kxa97pyg0qhntxxpc6wrqb26',
      professional: PROFESSIONAL_PRICE_ID || 'pri_01kxahk87j0r2zfkr73r80eavh',
      enterprise: ENTERPRISE_PRICE_ID || 'pri_01kxahrjxef1c8mj443npcqjb8',
    },
    annual: {
      starter: ANNUAL_STARTER_PRICE_ID || 'pri_01kxap9yzqh75rx2vxjdseb3jb',
      professional: ANNUAL_PROFESSIONAL_PRICE_ID || 'pri_01kxapc46cgpsp3j0gxh22eg29',
      enterprise: ANNUAL_ENTERPRISE_PRICE_ID || 'pri_01kxapdq6jteztwpqdeggj6qkj',
    },
  };

  useEffect(() => {
    // Fetch prices using Paddle.PricePreview helper directly on the frontend
    const fetchPricing = async () => {
      setIsLoading(true);
      setError(null);

      const activeIds = billingCycle === 'monthly' ? priceIds.monthly : priceIds.annual;

      try {
        const activePriceIds = Object.values(activeIds).filter(Boolean);
        const fetchedPrices = await getPaddlePrices(activePriceIds);
        
        const mappedPrices: Record<string, string> = {};
        Object.keys(activeIds).forEach(key => {
          const id = activeIds[key];
          if (fetchedPrices[id]) {
            mappedPrices[key] = fetchedPrices[id];
          } else {
            mappedPrices[key] = 'couldnt fetch';
          }
        });
        setPrices(mappedPrices);
      } catch (err: any) {
        console.error("Error fetching pricing from Paddle PricePreview:", err);
        setError("Failed to fetch live pricing.");
        const failedPrices: Record<string, string> = {
          starter: 'couldnt fetch',
          professional: 'couldnt fetch',
          enterprise: 'couldnt fetch'
        };
        setPrices(failedPrices);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, [billingCycle]);

  const handleCheckout = async (priceId: string) => {
    if (!priceId) return;

    try {
      const paddle = await initPaddle();
      if (paddle && paddle.Checkout) {
        paddle.Checkout.open({
          items: [{ priceId: priceId, quantity: 1 }],
          settings: {
            displayMode: 'overlay',
            variant: 'one-page',
            theme: 'light',
            locale: 'en',
            successUrl: `${window.location.origin}/welcome`
          },
          customData: {
            workspace_id: user?.id,
            tier_id: Object.keys(priceIds[billingCycle]).find(key => priceIds[billingCycle][key as keyof typeof priceIds.monthly] === priceId) || 'starter'
          },
          eventCallback: async (event: any) => {
            // --- CASE 0: Intercept Quantity / Items Updates ---
            if (event.name === 'checkout.items.updated' || event.name === 'checkout.updated') {
              const items = event.data?.items || [];
              const needsUpdate = items.some((item: any) => item.quantity !== 1);
              if (needsUpdate) {
                console.log("Subscription detected: Forcing quantity back to 1.");
                paddle.Checkout.updateItems(
                  items.map((item: any) => ({
                    priceId: item.priceId || item.price?.id,
                    quantity: 1
                  }))
                );
              }
            }

            // --- CASE 1: Checkout Loaded Successfully ---
            if (event.name === 'checkout.loaded') {
              console.log("The checkout overlay is now visible to the user.");
            }

            // --- CASE 2: Payment Completed Successfully ---
            if (event.name === 'checkout.completed') {
              console.log("Payment successful on the frontend!", event.data);
              
              // Show an immediate visual success message to the user
              toast.success("Thank you! Processing your order now...");
              
              // Send a quick ping to backend to refresh/sync the user subscription state
              try {
                await fetch(`${API_BASE_URL}/v1/payments/sync-session`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    userId: user?.id, 
                    transactionId: event.data.transactionId || event.data.transaction?.id || event.data.transaction_id
                  })
                });
              } catch (err) {
                console.log("Backend sync ping failed, but webhook will handle it anyway:", err);
              }

              // Redirect the user to their onboarding/welcome page
              window.location.href = "/welcome?payment=success";
            }

            // --- CASE 3: Checkout Closed / Abandoned ---
            if (event.name === 'checkout.closed') {
              console.log("The user closed the checkout window without paying.");
              toast.info("Checkout cancelled. Let us know if you have any questions!");
            }

            // --- CASE 4: An Error Occurred Inside Checkout ---
            if (event.name === 'checkout.error') {
              console.error("Checkout experienced an error:", event.data);
              toast.error("Something went wrong with the checkout. Please try again.");
            }
          }
        });
      } else {
        console.error("Paddle SDK client not ready.");
      }
    } catch (err) {
      console.error("Error opening checkout:", err);
    }
  };

  const handleAction = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'candidate') {
      navigate('/candidate/dashboard');
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
        <p className="text-xs text-zinc-400 leading-relaxed mb-6">{error}</p>
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
      <div className={`grid gap-6 items-stretch ${
        PLAN_ORDER.filter(pk => !(user && user.plan_name && user.plan_name.toLowerCase() === pk.toLowerCase())).length === 2
          ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
          : PLAN_ORDER.filter(pk => !(user && user.plan_name && user.plan_name.toLowerCase() === pk.toLowerCase())).length === 1
            ? 'grid-cols-1 max-w-md mx-auto'
            : 'grid-cols-1 md:grid-cols-3'
      }`}>
        {PLAN_ORDER.map((planKey) => {
          const meta = PLAN_META[planKey];
          if (!meta) return null;

          // Hide the card corresponding to the user's current plan
          if (user && user.plan_name && user.plan_name.toLowerCase() === planKey.toLowerCase()) {
            return null;
          }

          const Icon = meta.icon;
          const displayPrice = prices[planKey] || 'Loading...';
          const priceId = priceIds[billingCycle][planKey] || '';

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
              key={planKey}
              className={`group relative rounded-2xl flex flex-col transition-all duration-500 ${
                meta.highlight ? 'md:-mt-3 md:mb-[-12px] scale-[1.02] md:scale-[1.03] z-10' : ''
              }`}
            >
              {/* Border decoration */}
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                  meta.highlight
                    ? 'bg-gradient-to-b from-accentPurple via-accentPurple/40 to-accentCyan p-[2px] shadow-2xl shadow-accentPurple/10'
                    : 'bg-zinc-800/80 p-[1px] group-hover:bg-gradient-to-b group-hover:from-accentPurple/45 group-hover:via-zinc-700/50'
                }`}
              >
                <div className="w-full h-full rounded-2xl bg-zinc-950/95 backdrop-blur-md"></div>
              </div>

              {/* Badge */}
              {meta.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                  <div className="px-4 py-1 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg shadow-accentPurple/30 flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />
                    {meta.badge}
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
                        meta.highlight
                          ? 'bg-accentPurple/20 ring-1 ring-accentPurple/40'
                          : 'bg-zinc-900 ring-1 ring-zinc-800 group-hover:bg-accentPurple/15 group-hover:ring-accentPurple/30'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors duration-300 ${
                          meta.highlight ? 'text-accentPurple' : 'text-zinc-400 group-hover:text-accentPurple'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-100">{meta.name}</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{meta.description}</p>
                    </div>
                  </div>
                </div>

                {/* Price & Interview Count */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {displayPrice === 'couldnt fetch' ? (
                      <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent tracking-tight uppercase border border-red-500/20 px-3.5 py-1.5 bg-red-500/5 rounded-xl">
                        couldnt fetch
                      </span>
                    ) : (
                      <span className="text-4xl sm:text-5xl font-extrabold text-zinc-50 tracking-tight">
                        {displayPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-accentPurple font-semibold mt-2.5">
                    {meta.interviews}
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
                    meta.highlight
                      ? 'bg-gradient-to-r from-transparent via-accentPurple/30 to-transparent'
                      : 'bg-zinc-800/60'
                  }`}
                ></div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {meta.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          meta.highlight
                            ? 'bg-accentPurple/25'
                            : 'bg-zinc-800/80 group-hover:bg-accentPurple/15'
                        }`}
                      >
                        <Check
                          className={`w-3 h-3 transition-colors duration-300 ${
                            meta.highlight
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
                      meta.highlight
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
                      meta.highlight
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
