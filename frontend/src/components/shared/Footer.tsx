import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 text-zinc-300 relative z-10 w-full mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Branding/About Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accentPurple/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accentPurple" />
              </div>
              <span className="font-extrabold text-base text-zinc-100 tracking-tight">Employites</span>
            </div>
            <p className="text-xs text-zinc-450 leading-relaxed max-w-sm">
              HR note-taking and productivity copilot that transcribes interview audio and simplifies meeting documentation. 100% of candidate screening, selection, and hiring decisions are left strictly to human HR professionals.
            </p>
          </div>

          {/* Platform / Policies Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Legal & Policies</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/terms" className="hover:text-accentPurple transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accentPurple transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="hover:text-accentPurple transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-accentPurple transition-colors">
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Queries & Contact Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Support & Contact</h4>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Have questions or need assistance? Feel free to reach out to our team.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs">
              <Mail className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" />
              <a href="mailto:support@employites.com" className="text-zinc-100 hover:text-accentPurple transition-colors font-medium">
                support@employites.com
              </a>
            </div>
          </div>
        </div>

        {/* Global Compliance Disclaimer Row */}
        <div className="mt-8 pt-6 border-t border-zinc-900/60">
          <p className="text-[11px] text-zinc-550 leading-relaxed text-left italic">
            Disclaimer: Employites is a productivity workflow assistant for hiring managers. Our software does not make, score, or materially influence employment or evaluation decisions. All final hiring determinations are strictly executed by natural human recruiters.
          </p>
        </div>

        {/* Copyright & Processor Row */}
        <div className="mt-6 pt-4 border-t border-zinc-900/40 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
          <p>
            © {new Date().getFullYear()} Employites. All rights reserved.
          </p>
          <p>
            Platform secure checkout processed by Paddle.
          </p>
        </div>
      </div>
    </footer>
  );
};
