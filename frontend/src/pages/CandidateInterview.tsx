import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { VideoRecorder } from '../components/ui/VideoRecorder';
import { 
  ClipboardList, CheckCircle2, Shield, Eye, ChevronRight, Sparkles, Check, Loader2, User, Mail, Video 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

export const CandidateInterview: React.FC = () => {
  const { user, loginAsCandidate, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search parameters for pre-filling token from landing page redirect
  const urlToken = searchParams.get('token') || '';

  // Check-in form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [tokenInput, setTokenInput] = useState(urlToken);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkinError, setCheckinError] = useState('');

  // Active Job states
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string>('Standard Screening Assessment');
  const [jobDesc, setJobDesc] = useState<string>('General technical and communication evaluation.');
  const [isLoadingJob, setIsLoadingJob] = useState(true);

  // Dynamic assessment questions
  const [questions, setQuestions] = useState<string[]>([
    'Explain React Concurrent mode rendering and how it benefits UI responsiveness.',
    'Describe your design system architectural pattern and how you scale Tailwind CSS configuration across projects.',
    'How do you manage state transitions and coordinate media devices when building interactive browser components?'
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedUploads, setCompletedUploads] = useState<string[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch job details by candidate's invite token on mount/auth update
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!user?.candidateToken) {
        setIsLoadingJob(false);
        return;
      }
      setIsLoadingJob(true);
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/token/${user.candidateToken}`);
        if (res.ok) {
          const matchedJob = await res.json();
          setJobId(matchedJob.id);
          setJobTitle(matchedJob.title);
          setJobDesc(matchedJob.description);
          
          // Use job-specific requirements prompt if configured, else fallback to standard defaults
          if (Array.isArray(matchedJob.questions) && matchedJob.questions.length > 0) {
            setQuestions(matchedJob.questions);
          } else if (matchedJob.requirements) {
            setQuestions([matchedJob.requirements]);
          }
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobDetails();
  }, [user]);

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !candidateEmail || !tokenInput) return;

    setIsCheckingIn(true);
    setCheckinError('');

    const res = await loginAsCandidate(tokenInput.toUpperCase().trim(), candidateEmail.trim(), firstName, lastName);
    setIsCheckingIn(false);

    if (!res.success) {
      setCheckinError(res.message || 'Failed to authenticate invitation code.');
    }
  };

  const handleUploadComplete = (key: string) => {
    console.log(`Video response uploaded. Key: ${key}`);
    const updated = [...completedUploads, key];
    setCompletedUploads(updated);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 1200);
    }
  };

  const handleFinalizeSession = async () => {
    if (completedUploads.length === 0) return;
    setIsFinishing(true);
    setErrorMsg('');

    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/submissions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          job_id: jobId,
          candidate_email: user?.email,
          candidate_first_name: user?.name?.split(' ')[0] || 'Candidate',
          candidate_last_name: user?.name?.split(' ').slice(1).join(' ') || 'User',
          video_url: completedUploads.join(",")
        })
      });

      if (!res.ok) {
        throw new Error('Evaluation submission request failed.');
      }

      setIsDone(true);
    } catch (err) {
      console.error('Finalization error:', err);
      setErrorMsg('Failed to process final AI assessment ratings.');
    } finally {
      setIsFinishing(false);
    }
  };

  const isAllAnswered = completedUploads.length >= questions.length;

  // Render Check-In form directly if candidate session is inactive
  if (!user || user.role !== 'candidate') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md relative">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-accentPurple/10 blur-3xl -z-10"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-accentCyan/10 blur-3xl -z-10"></div>

          <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>

            <div className="mb-6 text-center">
              <h2 className="text-xl font-extrabold text-white flex items-center justify-center gap-1.5">
                Candidate Check-In <Sparkles className="w-4 h-4 text-accentCyan" />
              </h2>
              <p className="text-xs text-gray-400 mt-1">Please enter your application details to access the assessment.</p>
            </div>

            {checkinError && (
              <div className="p-3.5 bg-rose-950/40 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl mb-5 text-center leading-relaxed">
                {checkinError}
              </div>
            )}

            <form onSubmit={handleCheckinSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full pl-8 pr-3 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    className="w-full pl-8 pr-3 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invite Token</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="INV-XXXXXX"
                    className="w-full pl-8 pr-3 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-600 focus:outline-none text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCheckingIn}
                className="glow-btn w-full py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 mt-6"
              >
                {isCheckingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Interview Assessment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingJob) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin text-accentCyan mb-3" />
        <p className="text-xs">Formulating dynamic interview parameters...</p>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md glass-panel rounded-2xl p-8 text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-accentCyan"></div>
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-xl font-extrabold text-white">Interview Submitted Successfully!</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Thank you for completing the screening. Your verbal answers, telemetry cost controls, and code explanations are being processed.
          </p>
          <div className="pt-4 border-t border-zinc-900">
            <button 
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-gray-300 hover:text-white rounded-xl transition-all"
            >
              Exit Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Upper context banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 mb-8 gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-accentCyan uppercase tracking-widest bg-accentCyan/10 border border-accentCyan/20 px-2.5 py-1 rounded">
            Candidate Assessment Console
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">{jobTitle}</h1>
          <p className="text-xs text-zinc-400 mt-1">{jobDesc}</p>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-white self-start md:self-auto transition-all"
        >
          Abandon Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left hand list of prompts */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-300 flex items-center gap-1.5 uppercase tracking-wider">
              <ClipboardList className="w-4 h-4 text-accentPurple" /> Assessment Prompts
            </h3>

            <div className="space-y-2">
              {questions.map((q, idx) => {
                const isCompleted = completedUploads.length > idx;
                const isActive = currentQuestionIndex === idx;

                return (
                  <button
                    key={idx}
                    disabled={idx > completedUploads.length}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-start justify-between gap-3 ${
                      isActive 
                        ? 'bg-gradient-to-r from-accentPurple/20 to-accentCyan/10 border-accentPurple/40 text-white' 
                        : isCompleted
                          ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400'
                          : 'bg-zinc-950/20 border-zinc-900/40 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">Question {idx + 1}</span>
                      <p className="line-clamp-2 pr-1">
                        {idx <= completedUploads.length ? q : "Locked Question (Complete previous answers to unlock)"}
                      </p>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-accentCyan flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-gray-300">Privacy Safeguard Active</h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                Raw recordings are stored ephemerally. Evaluator parsing runs immediately, following which files are completely purged.
              </p>
            </div>
          </div>
        </div>

        {/* Right Hand side Video Recorder Console */}
        <div className="lg:col-span-2 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <VideoRecorder 
            key={currentQuestionIndex}
            questionText={questions[currentQuestionIndex]}
            onUploadComplete={handleUploadComplete}
          />

          {/* Submission Bar */}
          <div className="flex justify-between items-center bg-zinc-950/80 border border-zinc-900 rounded-xl p-4">
            <div className="text-xs text-zinc-500">
              {completedUploads.length} of {questions.length} questions completed
            </div>

            <button
              onClick={handleFinalizeSession}
              disabled={!isAllAnswered || isFinishing}
              className={`glow-btn px-6 py-3 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all ${
                isAllAnswered 
                  ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white shadow-lg hover:opacity-95' 
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
              }`}
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Responses...
                </>
              ) : (
                <>
                  Finalize & Submit Session <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
