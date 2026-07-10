import React, { useState } from 'react';
import { Video, ArrowRight, CheckCircle, Sparkles, Terminal, Cpu, Kanban, Check } from 'lucide-react';
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
    onCandidateStart(tokenInput.toUpperCase().trim());
  };

  return (
    <div className="min-h-screen text-gray-100 bg-[#070709] font-sans antialiased selection:bg-accentPurple/25 selection:text-white relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 grid-bg-overlay opacity-[0.15] pointer-events-none -z-20"></div>

      {/* Elegant Radial Light source */}
      <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-b from-accentPurple/10 to-transparent blur-[130px] pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header/Hero Section */}
        <header className="pt-24 pb-16 md:pt-36 md:pb-24 text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/40 border border-zinc-800/60 rounded-full text-[10px] font-bold text-accentPurple tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-accentPurple" /> Autonomous Screening Pipeline
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
            Async video vetting.<br />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-accentPurple bg-clip-text text-transparent">
              Automated by AI.
            </span>
          </h1>
          
          <p className="text-xs md:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Screen candidates automatically. Get detailed communication ratings, technical depth analysis, and anti-cheat telemetry parsed by Gemini AI.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => setShowPaddle(true)}
              className="glow-btn px-6 py-3 bg-accentPurple text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
            >
              Start as Recruiter
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
            >
              See Pipeline
            </a>
          </div>
        </header>

        {/* Portal Access & Mockup Layout Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 items-stretch">
          
          {/* Candidate Access Card */}
          <div className="lg:col-span-5 p-8 rounded-xl border border-zinc-900 bg-zinc-950/20 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-accentPurple tracking-widest uppercase flex items-center gap-1.5">
                <Video className="w-4 h-4" /> Candidate Area
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">Access Invite Panel</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Invited to record an async screening? Input your invitation code below to launch the webcam recorder.
              </p>
            </div>

            <form onSubmit={handleCandidateSubmit} className="space-y-3 mt-8">
              <input
                type="text"
                required
                placeholder="INV-XXXXXX"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setCandidateError('');
                }}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-900 focus:border-accentPurple/50 rounded-lg text-white font-mono text-xs focus:outline-none text-center tracking-wider placeholder-zinc-800"
              />
              {candidateError && (
                <p className="text-[10px] text-rose-500 font-bold text-center mt-1">{candidateError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-850 text-accentPurple border border-zinc-800 hover:border-accentPurple/30 font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
              >
                Access Screening Screen
              </button>
            </form>
          </div>

          {/* Interactive Live Screen Mockup */}
          <div className="lg:col-span-7 rounded-xl border border-zinc-900 overflow-hidden relative bg-zinc-950 flex items-center justify-center min-h-[300px]">
            <img 
              src="/hero_screener_mockup.jpg" 
              alt="Dashboard screenshot" 
              className="w-full h-full object-cover opacity-75"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Minimal glowing badge */}
            <div className="absolute bottom-4 left-4 bg-zinc-950/80 border border-zinc-900/60 px-3 py-1 rounded-full text-[9px] font-bold text-accentPurple tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accentPurple animate-ping"></span>
              Workspace Preview
            </div>
          </div>
        </section>

        {/* Feature Workflow */}
        <section id="how-it-works" className="border-t border-zinc-900/50 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Vetting Columns details */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-accentPurple tracking-widest uppercase">System Design</span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-white mt-2 tracking-tight">Vetting Vitals</h2>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  We pipeline screening by combining lightweight client-side recordings and autonomous worker evaluation loops.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex gap-4 p-4 rounded-lg bg-zinc-950/10 border border-zinc-900/40 hover:border-zinc-900 transition-all">
                  <span className="text-xs font-bold text-accentPurple">01/</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider mb-1">Define the Prompts</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Recruiters configure role details, interview questions, and evaluation criteria. The API issues secure applicant tokens.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-zinc-950/10 border border-zinc-900/40 hover:border-zinc-900 transition-all">
                  <span className="text-xs font-bold text-accentPurple">02/</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider mb-1">Direct Stream Upload</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Candidates answer assessment items. Live webcam chunks stream directly to secure R2 buckets utilizing compressed video codecs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-zinc-950/10 border border-zinc-900/40 hover:border-zinc-900 transition-all">
                  <span className="text-xs font-bold text-accentPurple">03/</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider mb-1">AI Ingestion & Grading</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Asynchronous workers download clips, evaluate responses, detect fraud alerts, and rank candidate logs on the Kanban board.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Video preview */}
            <div className="lg:col-span-7">
              <div className="p-2 rounded-xl border border-zinc-900 bg-zinc-950/40">
                <div className="relative aspect-video rounded-lg bg-black overflow-hidden flex items-center justify-center border border-zinc-900/60 shadow-lg">
                  <video 
                    className="w-full h-full object-cover opacity-70"
                    src="https://www.w3schools.com/html/mov_bbb.mp4"
                    controls
                    poster="/hero_screener_mockup.jpg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Table */}
        <section id="pricing" className="border-t border-zinc-900/50 py-24">
          <div className="text-center space-y-4 mb-20">
            <span className="text-xs font-bold text-accentPurple tracking-widest uppercase">Licensing Models</span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">Flexible SaaS Subscriptions</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Select a tier matching your recruiting volumes. Secure checkout processed by Paddle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Free */}
            <div className="p-8 rounded-xl border border-zinc-900 bg-zinc-950/15 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Growth Starter</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$0</span>
                    <span className="text-xs font-semibold text-zinc-500">/ forever</span>
                  </div>
                </div>
                
                <ul className="space-y-3 text-xs text-zinc-350 border-t border-zinc-900/60 pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> 3 Screening Submissions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Standard Video bitrates
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Gemini-powered rating summary
                  </li>
                </ul>
              </div>
              
              <button
                onClick={onRecruiterStart}
                className="mt-8 w-full py-2.5 bg-zinc-900/40 hover:bg-zinc-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all border border-zinc-800"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-xl border border-accentPurple/30 bg-zinc-950/20 flex flex-col justify-between relative transform md:scale-105 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-accentPurple"></div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[9px] font-extrabold text-accentPurple uppercase tracking-widest">Recruiter Pro</h4>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">$99</span>
                      <span className="text-xs font-semibold text-zinc-500">/ month</span>
                    </div>
                  </div>
                  <span className="bg-accentPurple/10 text-accentPurple text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border border-accentPurple/20 tracking-wider">
                    Popular
                  </span>
                </div>
                
                <ul className="space-y-3 text-xs text-zinc-250 border-t border-zinc-900/60 pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Unlimited Candidate Submissions
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Compressed 500kbps uploads
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Active Telemetry integrity flags
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Full Kanban Board Pipeline
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowPaddle(true)}
                className="mt-8 w-full py-3 bg-accentPurple hover:opacity-95 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all"
              >
                Upgrade via Paddle
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-xl border border-zinc-900 bg-zinc-950/15 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Enterprise</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">$249</span>
                    <span className="text-xs font-semibold text-zinc-500">/ month</span>
                  </div>
                </div>
                
                <ul className="space-y-3 text-xs text-zinc-350 border-t border-zinc-900/60 pt-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Everything in Recruiter Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> API direct endpoints access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Custom prompt questions tuning
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-accentPurple flex-shrink-0" /> Dedicated platform owner support
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowPaddle(true)}
                className="mt-8 w-full py-2.5 bg-zinc-900/40 hover:bg-zinc-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all border border-zinc-800"
              >
                Contact Support
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900/60 py-12 bg-[#040405] text-center relative z-10">
        <p className="text-[10px] text-zinc-650 tracking-wider">
          © {new Date().getFullYear()} Screener AI. All rights reserved. Platform secure checkout by Paddle.
        </p>
      </footer>

      {/* Paddle checkout overlay */}
      {showPaddle && (
        <PaddleCheckout 
          isOpen={showPaddle} 
          onClose={() => {
            setShowPaddle(false);
            onRecruiterStart();
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
