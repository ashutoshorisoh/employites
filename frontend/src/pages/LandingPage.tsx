import React, { useState } from 'react';
import { Video, ArrowRight, CheckCircle, Sparkles, Terminal, Cpu, Kanban, Check, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PricingSectionNew } from '../components/shared/PricingSectionNew';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/shared/Footer';

interface LandingPageProps {
  onRecruiterStart: () => void;
  onCandidateStart: (token: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onRecruiterStart, onCandidateStart }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [candidateError, setCandidateError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.role === 'candidate') {
      navigate('/candidate/dashboard');
    }
  }, [user, navigate]);

  const handleCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setCandidateError('Please enter a valid invitation token.');
      return;
    }
    onCandidateStart(tokenInput.toUpperCase().trim());
  };

  return (
    <div className="min-h-screen text-zinc-800 bg-transparent font-sans antialiased selection:bg-accentPurple/25 selection:text-white relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 grid-bg-overlay opacity-[0.15] pointer-events-none -z-20"></div>

      {/* Elegant Radial Light source */}
      <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-b from-accentPurple/10 to-transparent blur-[130px] pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">

        {/* Outermost wrapper container of the Hero section to occupy full viewport depth */}
        <div className="min-h-[calc(100vh-73px)] flex flex-col items-center justify-center py-12 md:py-16">
          {/* Header/Hero Section */}
          <header className="w-full text-center space-y-6 max-w-3xl mx-auto mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/40 border border-zinc-800/60 rounded-full text-[10px] font-bold text-accentPurple tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-accentPurple" /> Interview Audio Transcription Copilot
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-zinc-100">
              Speed Up Hiring Decisions.<br />
              <span className="bg-gradient-to-r from-accentPurple via-orange-500 to-rose-600 bg-clip-text text-transparent">
                Stop Writing Feedback From Memory.
              </span>
            </h1>

            <p className="text-xs md:text-sm text-zinc-200 max-w-2xl mx-auto leading-relaxed">
              Recruiters shouldn't multitask while evaluating talent. Employites seamlessly hosts your initial screening rounds—allowing candidates to freely showcase their core skills while our engine records and structures the live session audio. Get instant transcripts and competency-mapped candidate profile data delivered straight to your dashboard, keeping your human hiring managers 100% in control of the final shortlist.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={onRecruiterStart}
                className="glow-btn px-6 py-3 bg-accentPurple text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
              >
                Start as Recruiter
              </button>
              <a
                href="#how-it-works"
                className="px-6 py-3 bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-accentPurple hover:border-accentPurple/25 font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
              >
                See Workflow
              </a>
            </div>
          </header>

          {/* Portal Access & Mockup Layout Grid */}
          <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* Candidate Access Card */}
          <div className="lg:col-span-5 p-8 rounded-xl border border-zinc-800/80 bg-zinc-950/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-accentPurple tracking-widest uppercase flex items-center gap-1.5">
                <Video className="w-4 h-4" /> Candidate Area
              </span>
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Access Invite Panel</h3>
              <p className="text-xs text-zinc-200 leading-relaxed">
                Invited to record an interview session? Input your invitation code below to launch the webcam recorder.
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
                className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-850 focus:border-accentPurple/50 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none text-center tracking-wider placeholder-zinc-200"
              />
              {candidateError && (
                <p className="text-[10px] text-rose-600 font-bold text-center mt-1">{candidateError}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 bg-zinc-900 hover:bg-accentPurple text-accentPurple hover:text-white border border-zinc-800 hover:border-accentPurple font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
              >
                Access Interview Session
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
      </div>

        {/* Feature Workflow */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-zinc-900/50 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Vetting Columns details */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-accentPurple tracking-widest uppercase">Workflow Design</span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-100 mt-2 tracking-tight">Note-taking Vitals</h2>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  We simplify meeting documentation by combining lightweight client-side recordings and speech-to-text transcription loops.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex gap-4 p-4 rounded-lg bg-zinc-950/10 border border-zinc-900/40 hover:border-zinc-900 transition-all">
                  <span className="text-xs font-bold text-accentPurple">01/</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-zinc-100 uppercase tracking-wider mb-1">Define the Structure</h4>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Recruiters configure role details, interview questions, and custom note templates. The API issues secure applicant tokens.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-zinc-950/10 border border-zinc-900/40 hover:border-zinc-900 transition-all">
                  <span className="text-xs font-bold text-accentPurple">02/</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-zinc-100 uppercase tracking-wider mb-1">Direct Stream Upload</h4>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Candidates answer assessment items. Live webcam chunks stream directly to secure R2 buckets utilizing compressed video codecs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-zinc-950/10 border border-zinc-900/40 hover:border-zinc-900 transition-all">
                  <span className="text-xs font-bold text-accentPurple">03/</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-zinc-100 uppercase tracking-wider mb-1">AI-Powered Transcription</h4>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Asynchronous workers transcribe clips, summarize key feedback points, and present organized candidate notes on the Recruiter Dashboard.
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
            <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-100 tracking-tight">Flexible SaaS Subscriptions</h2>
            <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
              Select a plan matching your recruiting volumes. Secure checkout processed by Paddle.
            </p>
          </div>

          <PricingSectionNew onSuccess={onRecruiterStart} />
        </section>

      </div>

      <Footer />

    </div>
  );
};
