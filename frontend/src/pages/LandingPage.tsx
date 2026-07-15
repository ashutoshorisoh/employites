import React, { useState } from 'react';
import { Video, ArrowRight, CheckCircle, Sparkles, Terminal, Cpu, Kanban, Check, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PricingSectionNew } from '../components/shared/PricingSectionNew';
import { useAuth } from '../context/AuthContext';
import { Footer } from '../components/shared/Footer';

interface LandingPageProps {
  onRecruiterStart: () => void;
  onCandidateStart: (token: string) => void;
  showCandidateAccess: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onRecruiterStart, onCandidateStart, showCandidateAccess }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [candidateError, setCandidateError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
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

  // Pipeline step definitions for left sidebar and right tabbed visualizer
  const pipelineSteps = [
    {
      title: "Create Session Link",
      subtitle: "Step 1",
      description: "HR initializes standard transcript parameters and structures guidelines.",
      badge: "Parameters Setup"
    },
    {
      title: "Session Recording",
      subtitle: "Step 2",
      description: "System registers structured audio feeds cleanly during candidate interaction.",
      badge: "Audio Registry"
    },
    {
      title: "Executive Transcripts",
      subtitle: "Step 3",
      description: "Dashboard delivers instant, clean text logs and competency-mapped overviews directly to human reviewers.",
      badge: "Dashboard Delivery"
    }
  ];

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

          {/* Portal Access */}
          {showCandidateAccess && (
            <section className="w-full max-w-md mx-auto">
              {/* Candidate Access Card */}
              <div className="p-8 rounded-xl border border-zinc-800/80 bg-zinc-950/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
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
            </section>
          )}
        </div>

        {/* Feature Workflow */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-zinc-900/50 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">

            {/* Vetting Columns details */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-accentPurple tracking-widest uppercase">Workflow Design</span>
                <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-100 mt-2 tracking-tight">Note-taking Vitals</h2>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  We simplify meeting documentation by combining lightweight client-side recordings and speech-to-text transcription loops.
                </p>
              </div>

              <div className="space-y-4 pt-8">
                {pipelineSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full text-left flex gap-4 p-4 rounded-lg border transition-all ${
                      activeTab === idx
                        ? 'bg-zinc-900/65 border-accentPurple/50 shadow-md'
                        : 'bg-zinc-950/10 border-zinc-900/40 hover:border-zinc-850 hover:bg-zinc-900/20'
                    }`}
                  >
                    <span className={`text-xs font-bold ${activeTab === idx ? 'text-accentPurple' : 'text-zinc-500'}`}>
                      0{idx + 1}/
                    </span>
                    <div>
                      <h4 className={`font-extrabold text-xs uppercase tracking-wider mb-1 ${activeTab === idx ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Data Pipeline Component */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="p-1 rounded-xl border border-zinc-900 bg-zinc-950/40 flex-1 flex flex-col">
                <div className="relative rounded-lg bg-zinc-950 flex-1 border border-zinc-900/60 shadow-lg p-6 flex flex-col justify-between min-h-[360px]">
                  {/* Top Bar / Header of Mockup */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600/60"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2 font-mono">
                        Pipeline Console
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold text-accentPurple bg-accentPurple/10 px-2 py-0.5 rounded border border-accentPurple/25 uppercase tracking-wider">
                      {pipelineSteps[activeTab].badge}
                    </span>
                  </div>

                  {/* Active tab content */}
                  <div className="flex-1 flex flex-col justify-center">
                    {activeTab === 0 && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="p-4 rounded border border-zinc-900 bg-zinc-900/20 space-y-3">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Configure Parameters</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-300 font-mono">
                              Role: Senior Engineer
                            </div>
                            <div className="p-2 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-300 font-mono">
                              Dept: Frontend UI
                            </div>
                          </div>
                          <div className="p-2.5 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-300 font-mono">
                            Guidelines: Focus on architecture, React hooks & web performance metrics.
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded bg-accentPurple/5 border border-accentPurple/20">
                          <span className="text-[10px] font-mono text-zinc-200">https://employites.com/inv/8F2D9A</span>
                          <span className="text-[9px] font-bold text-accentPurple bg-accentPurple/10 px-2 py-1 rounded cursor-pointer border border-accentPurple/20 hover:bg-accentPurple hover:text-white transition-all">
                            Copy Link
                          </span>
                        </div>
                      </div>
                    )}

                    {activeTab === 1 && (
                      <div className="space-y-4 text-center py-6 animate-fadeIn">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-950/20 border border-rose-900/40 rounded-full text-[10px] font-bold text-rose-500 uppercase tracking-widest mx-auto animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Stream Recording Live
                        </div>
                        <div className="h-16 flex items-center justify-center gap-1.5 my-4">
                          {[0.7, 0.4, 0.9, 0.6, 0.3, 0.8, 0.5, 0.9, 0.4, 0.7, 0.3, 0.6, 0.8].map((height, i) => (
                            <span
                              key={i}
                              className="w-1 bg-accentPurple rounded-full transition-all duration-300"
                              style={{
                                height: `${height * 100}%`,
                                animation: `pulse 1.2s ease-in-out infinite alternate`,
                                animationDelay: `${i * 0.08}s`
                              }}
                            ></span>
                          ))}
                        </div>
                        <span className="text-xs font-mono text-zinc-300">00:04:12</span>
                      </div>
                    )}

                    {activeTab === 2 && (
                      <div className="space-y-3 animate-fadeIn text-left">
                        <div className="flex gap-2">
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded">
                            Architecture - Strong
                          </span>
                          <span className="text-[9px] font-bold text-accentPurple bg-accentPurple/10 border border-accentPurple/20 px-2 py-0.5 rounded">
                            React Hooks - Experienced
                          </span>
                        </div>
                        <div className="p-3.5 rounded border border-zinc-900 bg-zinc-900/10 font-mono text-[10px] text-zinc-400 max-h-[160px] overflow-y-auto space-y-2 leading-relaxed">
                          <p><span className="text-zinc-200 font-bold">00:02</span> - Candidate outlines their experience designing scalable components.</p>
                          <p><span className="text-zinc-200 font-bold">00:45</span> - Explains state virtualization and lazy rendering of large list elements.</p>
                          <p><span className="text-zinc-200 font-bold">01:30</span> - Demonstrates clear understanding of performance profiling tools.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer details of console */}
                  <div className="border-t border-zinc-905 pt-3 mt-4 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span>STATE: SECURE_SYNC</span>
                    <span>ACTIVE_PIPELINE: DEPLOYED</span>
                  </div>
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
