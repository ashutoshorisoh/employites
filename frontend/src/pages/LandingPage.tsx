import React, { useState } from 'react';
import { Video, ShieldAlert, Award, Star, ArrowRight, Play, CheckCircle, UploadCloud, Users, Sparkles } from 'lucide-react';
import { PaddleCheckout } from '../components/shared/PaddleCheckout';

interface LandingPageProps {
  onRecruiterStart: () => void;
  onCandidateStart: (token: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onRecruiterStart, onCandidateStart }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showPaddle, setShowPaddle] = useState(false);
  const [candidateError, setCandidateError] = useState('');

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setCandidateError('Please enter a valid invitation token.');
      return;
    }
    // Simplistic token route routing validation
    onCandidateStart(tokenInput.toUpperCase().trim());
  };

  return (
    <div className="min-h-screen text-gray-100 bg-[#07070a] font-sans antialiased selection:bg-accentPurple/30 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-accentPurple/10 via-accentCyan/5 to-transparent rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-full text-xs font-bold text-accentPurple tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Async Recruiting
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white">
            Async AI Video <br />
            <span className="bg-gradient-to-r from-accentPurple via-accentCyan to-accentPink bg-clip-text text-transparent">
              Interviewing
            </span> That Scales.
          </h1>
          
          <p className="text-md md:text-lg text-gray-400 max-w-xl leading-relaxed">
            Screen candidates automatically. Get detailed communication ratings, technical depth analysis, and anti-cheat telemetry parsed by Gemini 1.5 Flash.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => setShowPaddle(true)}
              className="glow-btn px-6 py-3 bg-gradient-to-r from-accentPurple via-accentCyan to-accentPink text-white font-bold text-sm rounded-xl flex items-center gap-2 hover:opacity-95 transition-opacity"
            >
              Start as Recruiter <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 font-bold text-sm rounded-xl flex items-center gap-2 transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Social Proof metrics */}
          <div className="pt-8 border-t border-zinc-900/60 grid grid-cols-3 gap-6 max-w-md">
            <div>
              <span className="block text-2xl font-extrabold text-white">10x</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Recruiting Speed</span>
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-white">500k+</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Video Bits Limit</span>
            </div>
            <div>
              <span className="block text-2xl font-extrabold text-white">99.4%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Detection Accuracy</span>
            </div>
          </div>
        </div>

        {/* Hero image and Candidate invite box */}
        <div className="lg:col-span-5 space-y-6">
          {/* Glassmorphic Candidate Access portal */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentCyan to-accentPurple"></div>
            <h3 className="text-md font-extrabold text-white mb-2 flex items-center gap-2">
              <Video className="w-5 h-5 text-accentCyan" /> Candidate Portal
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Invited to screen for a job? Enter your access token below to submit your async interview.
            </p>

            <form onSubmit={handleCandidateSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="E.g., INV-REACT-SR"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setCandidateError('');
                }}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-900 focus:border-accentCyan/50 rounded-xl text-gray-100 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accentCyan/20 text-center"
              />
              {candidateError && (
                <p className="text-[10px] text-rose-400 font-semibold">{candidateError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-accentCyan border border-accentCyan/20 hover:border-accentCyan/40 font-bold text-xs rounded-xl transition-all"
              >
                Access Interview Panel
              </button>
            </form>
          </div>

          {/* Generated Product UI Graphic */}
          <div className="rounded-2xl border border-zinc-900 overflow-hidden shadow-2xl relative aspect-[16/10] bg-zinc-950">
            <img 
              src="/hero_screener_mockup.jpg" 
              alt="Screener AI Interview Dashboard UI" 
              className="w-full h-full object-cover opacity-90"
              onError={(e) => {
                // Fallback inside styling if public image asset copy is missed in some browsers
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Live glowing watermark */}
            <div className="absolute bottom-4 left-4 bg-zinc-950/90 border border-zinc-900/50 px-3 py-1 rounded-full text-[10px] font-bold text-accentCyan tracking-wider uppercase flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-accentCyan animate-pulse"></span>
              Live Product Screenshot
            </div>
          </div>
        </div>
      </section>

      {/* How it Works / Video Walkthrough Section */}
      <section id="how-it-works" className="border-t border-zinc-950 py-20 bg-zinc-950/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold text-accentCyan tracking-wider uppercase">Interactive Guide</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">How Screener Automates Screening</h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              We leverage client-side compressed webcam recording and Gemini 1.5 Flash algorithms to pipeline screening.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Description steps */}
            <div className="lg:col-span-5 space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accentPurple/10 border border-accentPurple/20 text-accentPurple font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-extrabold text-md text-white mb-1">Formulate the Interview</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Recruiters configure role details, requirements, and prompts. The backend generates a secure application token.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accentCyan/10 border border-accentCyan/20 text-accentCyan font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-extrabold text-md text-white mb-1">Record & Upload Directly</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Candidates fill application metrics, upload resumes, and record answers with a constrained 500kbps video codec. Blobs stream directly to Cloudflare R2.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accentPink/10 border border-accentPink/20 text-accentPink font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-extrabold text-md text-white mb-1">Gemini AI Synthesis</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Our asynchronous worker pulls candidates' recordings, parses responses, and structures evaluations inside your Kanban pipeline.
                  </p>
                </div>
              </div>
            </div>

            {/* Video walk/player preview */}
            <div className="lg:col-span-7">
              <div className="glass-panel p-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 relative overflow-hidden">
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden flex items-center justify-center group border border-zinc-900">
                  {/* Mock Video Stream Player */}
                  <video 
                    className="w-full h-full object-cover opacity-80"
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                    controls
                    poster="/hero_screener_mockup.jpg"
                  />
                  
                  {/* Mock Active overlay watermark to make it feel premium */}
                  <div className="absolute top-4 left-4 bg-black/85 border border-zinc-800 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-300 flex items-center gap-1.5 backdrop-blur-md pointer-events-none">
                    <Video className="w-3.5 h-3.5 text-accentPurple animate-pulse" />
                    How It Works Walkthrough
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Subscription Portal */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-accentPink tracking-wider uppercase">SaaS Licensing</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Simple, Transparent Pricing</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Choose a plan that fits your staffing demands. Fully integrated with secure Paddle payment gateways.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="glass-panel p-8 rounded-2xl relative flex flex-col justify-between border border-zinc-900 bg-zinc-950/20">
            <div>
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Growth Starter</h4>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs font-semibold text-zinc-500">/ forever</span>
              </div>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">Perfect for test-driving Screener for minor role screeners.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentPurple" /> 3 Screening Submissions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentPurple" /> standard Video bitrates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentPurple" /> Gemini-powered rating summary
                </li>
              </ul>
            </div>
            
            <button
              onClick={onRecruiterStart}
              className="mt-8 w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs rounded-xl transition-all border border-zinc-850"
            >
              Get Started Free
            </button>
          </div>

          {/* Recruiter Pro Tier */}
          <div className="glass-panel p-8 rounded-2xl relative flex flex-col justify-between border border-accentPurple/40 bg-zinc-950/40 transform scale-105 shadow-xl">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider shadow">
              Most Popular
            </div>

            <div>
              <h4 className="text-sm font-bold text-accentPurple uppercase tracking-widest">Recruiter Pro</h4>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$99</span>
                <span className="text-xs font-semibold text-zinc-500">/ month</span>
              </div>
              <p className="text-xs text-zinc-300 mt-3 leading-relaxed">Engineered for growing businesses who require continuous async loops.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-zinc-200">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentCyan" /> Unlimited Candidate Submissions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentCyan" /> Compressed 500kbps codec uploads
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentCyan" /> Active Telemetry integrity flags
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentCyan" /> Full Kanban Board Pipeline
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowPaddle(true)}
              className="mt-8 w-full py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white font-extrabold text-xs rounded-xl hover:shadow-lg transition-all"
            >
              Upgrade via Paddle
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="glass-panel p-8 rounded-2xl relative flex flex-col justify-between border border-zinc-900 bg-zinc-950/20">
            <div>
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Enterprise</h4>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$249</span>
                <span className="text-xs font-semibold text-zinc-500">/ month</span>
              </div>
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">Formulated for massive recruitment centers with API needs.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentPink" /> Everything in Recruiter Pro
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentPink" /> API direct endpoints access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentPink" /> Custom prompt questions tuning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accentPink" /> Dedicated platform owner support
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowPaddle(true)}
              className="mt-8 w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs rounded-xl transition-all border border-zinc-850"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-950 py-10 bg-zinc-950/60 text-center">
        <p className="text-xs text-zinc-500">
          © {new Date().getFullYear()} Screener AI. All rights reserved. Platform secure checkout by Paddle.
        </p>
      </footer>

      {/* Paddle billing Overlay Modal */}
      {showPaddle && (
        <PaddleCheckout 
          isOpen={showPaddle} 
          onClose={() => {
            setShowPaddle(false);
            onRecruiterStart(); // Redirect to dashboard mock upon checkout finish trigger
          }} 
          onSuccess={() => {
            setShowPaddle(false);
            onRecruiterStart();
          }}
        />
      )}
    </div>
  );
};
