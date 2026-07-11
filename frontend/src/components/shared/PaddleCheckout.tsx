import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Check, X, Loader2, CreditCard } from 'lucide-react';

interface PaddleCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

export const PaddleCheckout: React.FC<PaddleCheckoutProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'loading' | 'select' | 'payment' | 'completed'>('loading');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Paddle SDK public key lookup utilizing the #reqd key configuration placeholder
  const PADDLE_VENDOR_KEY = '#reqd key';

  useEffect(() => {
    if (isOpen) {
      setStep('loading');
      // Simulate Paddle.js loading delay
      const timer = setTimeout(() => {
        setStep('select');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const plans = [
    { id: 'starter', name: 'Starter Tier', price: '$79/mo', seats: 5, interviews: 120 },
    { id: 'grow', name: 'Grow Professional', price: '$129/mo', seats: 15, interviews: 200, popular: true },
    { id: 'enterprise', name: 'Enterprise Scale', price: '$199/mo', seats: 50, interviews: 300 },
  ];

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handlePay = async () => {
    setPaymentProcessing(true);
    // Simulate Paddle secure overlay callback + FastAPI backend webhook processing
    console.log(`Initiating Paddle Checkout. Vendor key used: ${PADDLE_VENDOR_KEY}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPaymentProcessing(false);
    setStep('completed');
    onSuccess(selectedPlan?.name || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative glass-panel rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl z-10 my-auto">
        {/* Colorful Gradient Border top */}
        <div className="w-full h-1.5 bg-gradient-to-r from-accentPurple via-accentCyan to-accentPink"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-200 hover:text-white hover:bg-zinc-900/60 p-1.5 rounded-lg transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <Loader2 className="w-12 h-12 text-accentCyan animate-spin mb-4" />
            <h3 className="text-lg font-bold text-gray-200">Loading plans...</h3>
            <p className="text-xs text-gray-500 mt-1">Just a moment</p>
          </div>
        )}

        {step === 'select' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                Unlock Premium Seats <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
              </h2>
              <p className="text-sm text-gray-400 mt-1">Select the best billing schedule for your recruiting squad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-xl p-5 flex flex-col justify-between border relative transition-all duration-300 ${p.popular
                      ? 'border-accentPurple/50 bg-accentPurple/5 hover:border-accentPurple/80 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accentPurple text-[10px] uppercase font-bold text-white px-2.5 py-0.5 rounded-full tracking-wider">
                      Most Selected
                    </span>
                  )}

                  {/* Plan header — always visible at top */}
                  <div>
                    <h3 className="font-bold text-white text-base">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white tracking-tight">{p.price.split('/')[0]}</span>
                      <span className="text-xs text-gray-500">/mo</span>
                    </div>

                    <ul className="mt-5 space-y-3 text-xs text-gray-400">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {p.seats} recruiter seats
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {p.interviews} screenings / month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> AI-powered evaluations
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Secure video storage
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(p)}
                    className={`glow-btn w-full mt-6 py-2.5 rounded-lg text-xs font-bold transition-all ${p.popular
                        ? 'bg-gradient-to-r from-accentPurple to-accentPink text-white hover:opacity-95'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-gray-200'
                      }`}
                  >
                    Select Plan
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-200">
              <Shield className="w-4 h-4 text-accentCyan" /> Secure payments powered by Paddle.
            </div>
          </div>
        )}

        {step === 'payment' && selectedPlan && (
          <div className="p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white">Confirm your plan</h3>
              <p className="text-xs text-gray-400 mt-1">Review your selection before completing checkout</p>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-400">Plan Option</span>
                <span className="text-white">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold mt-2.5 pt-2.5 border-t border-zinc-900">
                <span className="text-gray-400">Recurring Price</span>
                <span className="text-accentCyan font-bold">{selectedPlan.price}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paymentProcessing}
              className="glow-btn w-full py-3 bg-gradient-to-r from-accentCyan via-accentPurple to-accentPink text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
            >
              {paymentProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" /> Finalize Purchase
                </>
              )}
            </button>

            <button
              onClick={() => setStep('select')}
              disabled={paymentProcessing}
              className="w-full mt-3 py-2 bg-transparent text-xs text-zinc-200 hover:text-white font-semibold transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {step === 'completed' && (
          <div className="p-10 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Purchase Completed</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Your subscription is now active. You can start screening candidates right away.
            </p>
            <button
              onClick={onClose}
              className="glow-btn w-full mt-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-lg border border-zinc-700 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
