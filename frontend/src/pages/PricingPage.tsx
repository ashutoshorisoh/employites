import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PricingSectionNew } from '../components/shared/PricingSectionNew';
import { Footer } from '../components/shared/Footer';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen text-zinc-800 bg-transparent font-sans antialiased relative overflow-hidden flex flex-col justify-between">
      {/* Grid Background */}
      <div className="absolute inset-0 grid-bg-overlay opacity-[0.15] pointer-events-none -z-20"></div>

      {/* Radial Glow — top center */}
      <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-b from-accentPurple/8 to-transparent blur-[150px] pointer-events-none -z-10"></div>

      {/* Secondary glow — bottom */}
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[400px] rounded-full bg-gradient-to-t from-accentCyan/5 to-transparent blur-[120px] pointer-events-none -z-10"></div>

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-12 relative z-10 flex-1">
        {/* ─── Header ─── */}
        <section className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accentPurple/10 border border-accentPurple/20 rounded-full text-[11px] font-bold text-accentPurple tracking-widest uppercase mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Simple, Transparent Pricing
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-grey leading-tight">
            Choose the plan that fits{' '}
            <span className="bg-gradient-to-r from-accentPurple via-orange-500 to-accentCyan bg-clip-text text-transparent">
              your hiring needs
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-50 mt-3 max-w-xl mx-auto leading-relaxed">
            No hidden fees · No per-seat charges · 7-day money-back guarantee
          </p>
        </section>

        {/* ─── Pricing Section Component ─── */}
        <PricingSectionNew />

        {/* ─── Trust Bar ─── */}
        <section className="mt-12 sm:mt-16">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-200">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                SSL Encryption
              </span>
              <span className="hidden sm:inline text-zinc-700">·</span>
              <span>GDPR Compliant</span>
              <span className="hidden sm:inline text-zinc-700">·</span>
              <span>24/7 Monitoring</span>
              <span className="hidden sm:inline text-zinc-700">·</span>
              <span>7-Day Money-Back</span>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-200">
              <Link
                to="/terms"
                className="hover:text-accentPurple transition-colors duration-300 underline underline-offset-4 decoration-zinc-700 hover:decoration-accentPurple/50"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="hover:text-accentPurple transition-colors duration-300 underline underline-offset-4 decoration-zinc-700 hover:decoration-accentPurple/50"
              >
                Privacy
              </Link>
              <Link
                to="/refunds"
                className="hover:text-accentPurple transition-colors duration-300 underline underline-offset-4 decoration-zinc-700 hover:decoration-accentPurple/50"
              >
                Refunds
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
