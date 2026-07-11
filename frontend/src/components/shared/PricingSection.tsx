import React, { useState } from 'react';
import { Check, Sparkles, Zap, Building2, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PaddleCheckout } from './PaddleCheckout';

interface PricingSectionProps {
  onSuccess?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showPaddle, setShowPaddle] = useState(false);

  const isRecruiter = user?.role === 'recruiter';
  const isSubscribed = user?.is_subscribed;

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
      price: '$129',
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
      price: '$199',
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
    } else if (isRecruiter) {
      setShowPaddle(true);
    }
  };

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
          const originalPrice = parseInt(tier.price.slice(1));
          const displayPrice =
            billingCycle === 'annual'
              ? `$${Math.round(originalPrice * 0.8)}`
              : tier.price;

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
              className={`group relative rounded-2xl flex flex-col transition-all duration-500 ${tier.highlight ? 'md:-mt-3 md:mb-[-12px]' : ''
                }`}
            >
              {/* Border decoration */}
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-500 ${tier.highlight
                    ? 'bg-gradient-to-b from-accentPurple/70 via-accentPurple/25 to-accentCyan/10 p-[1.5px]'
                    : 'bg-zinc-800/60 p-[1px] group-hover:bg-gradient-to-b group-hover:from-accentPurple/30 group-hover:via-zinc-700/30'
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
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${tier.highlight
                          ? 'bg-accentPurple/15 ring-1 ring-accentPurple/30'
                          : 'bg-zinc-850 ring-1 ring-zinc-800 group-hover:bg-accentPurple/10 group-hover:ring-accentPurple/20'
                        }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-colors duration-300 ${tier.highlight ? 'text-accentPurple' : 'text-zinc-400 group-hover:text-accentPurple'
                          }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-100">{tier.name}</h3>
                      <p className="text-[11px] text-zinc-200">{tier.description}</p>
                    </div>
                  </div>
                </div>

                {/* Price & Interview Count */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold text-zinc-100 tracking-tight">
                      {displayPrice}
                    </span>
                    <span className="text-sm text-zinc-200 font-medium">
                      {tier.period}
                    </span>
                  </div>
                  <p className="text-xs text-accentPurple font-semibold mt-1.5">
                    {tier.interviews}
                  </p>
                  {billingCycle === 'annual' && (
                    <p className="text-[11px] text-green-600 mt-1 font-medium">
                      Billed annually · Save 20%
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div
                  className={`h-px mb-6 ${tier.highlight
                      ? 'bg-gradient-to-r from-transparent via-accentPurple/30 to-transparent'
                      : 'bg-zinc-800/60'
                    }`}
                ></div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${tier.highlight
                            ? 'bg-accentPurple/15'
                            : 'bg-zinc-800/80 group-hover:bg-accentPurple/10'
                          }`}
                      >
                        <Check
                          className={`w-3 h-3 transition-colors duration-300 ${tier.highlight
                              ? 'text-accentPurple'
                              : 'text-zinc-200 group-hover:text-accentPurple/80'
                            }`}
                        />
                      </div>
                      <span className="leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                <button
                  disabled={!!(user && !isRecruiter)}
                  onClick={handleAction}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${tier.highlight
                      ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white hover:shadow-xl hover:shadow-accentPurple/25 hover:-translate-y-0.5 glow-btn'
                      : 'bg-zinc-800/60 text-zinc-300 hover:bg-accentPurple hover:text-white border border-zinc-700/50 hover:border-accentPurple/30 hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                >
                  {btnText}
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paddle checkout overlay */}
      {showPaddle && (
        <PaddleCheckout
          isOpen={showPaddle}
          onClose={() => setShowPaddle(false)}
          onSuccess={() => {
            setShowPaddle(false);
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  );
};
