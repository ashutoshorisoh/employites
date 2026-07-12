import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { VideoRecorder } from '../components/ui/VideoRecorder';
import {
  ClipboardList, CheckCircle2, Shield, Eye, EyeOff, ChevronRight, Sparkles, Check, Loader2, User, Mail, Video, Lock, FileText, UploadCloud, AlertCircle, LogOut, Download
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

export const CandidateInterview: React.FC = () => {
  const {
    user, loginAsCandidate, loginCandidate, registerCandidate, requestCandidateOtp, logout
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search parameters for pre-filling token from landing page redirect
  const urlToken = searchParams.get('token') || '';

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'email' | 'login' | 'register'>('email');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState('');

  // JD Preview States
  const [tokenInput, setTokenInput] = useState(urlToken);
  const [previewJob, setPreviewJob] = useState<any | null>(null);
  const [isJdLoading, setIsJdLoading] = useState(false);
  const [jdError, setJdError] = useState('');

  // Active Interview states
  const [activeInterviewStarted, setActiveInterviewStarted] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
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

  // Candidate Dashboard States
  const [candidateApps, setCandidateApps] = useState<any[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadingSubId, setUploadingSubId] = useState<string | null>(null);

  // Fetch job details by invite token (JD Preview)
  const fetchJdByToken = async (token: string) => {
    if (!token) return;
    setIsJdLoading(true);
    setJdError('');
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/token/${token.toUpperCase().trim()}`);
      if (res.ok) {
        const job = await res.json();
        setPreviewJob(job);
        if (Array.isArray(job.questions) && job.questions.length > 0) {
          setQuestions(job.questions);
        } else if (job.requirements) {
          setQuestions([job.requirements]);
        }
      } else {
        setPreviewJob(null);
        setJdError('Invalid invite token. Please verify code.');
      }
    } catch (e) {
      console.error(e);
      setJdError('Failed to fetch job details.');
    } finally {
      setIsJdLoading(false);
    }
  };

  // Fetch candidate applications list for dashboard
  const fetchCandidateApps = async () => {
    if (!user || user.role !== 'candidate') return;
    setIsLoadingApps(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/candidate/applications`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCandidateApps(data);
      }
    } catch (e) {
      console.error('Failed to load candidate applications:', e);
    } finally {
      setIsLoadingApps(false);
    }
  };

  // Initial token loading
  useEffect(() => {
    if (urlToken) {
      fetchJdByToken(urlToken);
    }
  }, [urlToken]);

  // Load apps if logged in as candidate and not taking interview
  useEffect(() => {
    if (user && user.role === 'candidate' && !activeInterviewStarted) {
      fetchCandidateApps();
    }
  }, [user, activeInterviewStarted]);

  // Check candidate existence / Continue button
  const handleAuthEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    setIsAuthSubmitting(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/candidate/exists/${encodeURIComponent(authEmail.trim().toLowerCase())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.has_password) {
          setAuthStep('login');
        } else {
          setAuthStep('register');
        }
      } else {
        setAuthError('Connection error validating candidate.');
      }
    } catch (e) {
      console.error(e);
      setAuthError('Failed to contact verification server.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Request Registration OTP
  const handleRequestOtp = async () => {
    if (!authEmail) return;
    setIsAuthSubmitting(true);
    setAuthError('');
    setOtpSentMsg('');
    const res = await requestCandidateOtp(authEmail.trim().toLowerCase());
    setIsAuthSubmitting(false);
    if (res.success) {
      setOtpSentMsg('OTP code sent successfully!');
    } else {
      setAuthError(res.message || 'Failed to dispatch verification code.');
    }
  };

  // Registration submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authFirstName || !authLastName || !authPassword || !authOtp) return;
    setIsAuthSubmitting(true);
    setAuthError('');
    const res = await registerCandidate(authFirstName, authLastName, authEmail.trim().toLowerCase(), authPassword, authOtp);
    setIsAuthSubmitting(false);
    if (res.success) {
      setShowAuthModal(false);
      // Start checking into interview if a preview job exists
      if (previewJob) {
        handleCheckinAndStart();
      }
    } else {
      setAuthError(res.message || 'Verification or registration failed.');
    }
  };

  // Login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPassword) return;
    setIsAuthSubmitting(true);
    setAuthError('');
    const res = await loginCandidate(authEmail.trim().toLowerCase(), authPassword);
    setIsAuthSubmitting(false);
    if (res.success) {
      setShowAuthModal(false);
      if (previewJob) {
        handleCheckinAndStart();
      }
    } else {
      setAuthError(res.message || 'Invalid password.');
    }
  };

  // Handle Interview Checkin and start recorder
  const handleCheckinAndStart = async () => {
    if (!previewJob) return;
    setIsJdLoading(true);
    // Call candidate checkin endpoint to set cookies and link candidate token
    const res = await loginAsCandidate(
      previewJob.token,
      user?.email || authEmail,
      user?.name?.split(' ')[0] || authFirstName || 'Candidate',
      user?.name?.split(' ').slice(1).join(' ') || authLastName || 'User'
    );
    setIsJdLoading(false);
    if (res.success) {
      setJobId(previewJob.id);
      setQuestions(previewJob.questions || [previewJob.requirements]);
      setActiveInterviewStarted(true);
    } else {
      alert(res.message || 'Checkin failed.');
    }
  };

  // Video response upload completes
  const handleUploadComplete = (key: string) => {
    console.log(`Video response uploaded. Key: ${key}`);
    const updated = [...completedUploads, key];
    setCompletedUploads(updated);

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 1200);
    } else {
      handleFinalizeSession(updated);
    }
  };

  // Submit complete interview session
  const handleFinalizeSession = async (finalUploads: string[]) => {
    if (finalUploads.length === 0) return;
    setIsFinishing(true);
    setErrorMsg('');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    try {
      const res = await fetch(`${API_BASE_URL}/submissions`, {
        method: 'POST',
        headers: headers,
        credentials: 'include',
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

  // Resume Upload Handler (Shortlisted candidates)
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>, subId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    setUploadingSubId(subId);

    try {
      // 1. Get presigned URL
      const urlRes = await fetch(`${API_BASE_URL}/submissions/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type
        })
      });

      if (!urlRes.ok) throw new Error('Failed to get storage ticket.');
      const uploadData = await urlRes.json();

      // 2. PUT binary file directly to R2 bucket
      if (uploadData.upload_url && !uploadData.upload_url.includes('#reqd key')) {
        const storageRes = await fetch(uploadData.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file
        });
        if (!storageRes.ok) throw new Error('Failed transmitting resume to storage.');
      }

      // 3. Update candidate profile with R2 object path
      const saveRes = await fetch(`${API_BASE_URL}/auth/candidate/upload-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resume_url: uploadData.object_key || `uploads/mock_resume_${Date.now()}`
        })
      });

      if (!saveRes.ok) throw new Error('Failed linking resume to profile.');

      alert('Resume uploaded successfully! Recruiter has been notified.');
      fetchCandidateApps();
    } catch (err: any) {
      console.error('Resume upload failed:', err);
      alert(err.message || 'Failed to upload resume file.');
    } finally {
      setIsUploadingResume(false);
      setUploadingSubId(null);
    }
  };

  // Reset interview session completed state
  const resetInterviewForm = () => {
    setPreviewJob(null);
    setTokenInput('');
    setActiveInterviewStarted(false);
    setCurrentQuestionIndex(0);
    setCompletedUploads([]);
    setIsDone(false);
  };

  const isAllAnswered = completedUploads.length >= questions.length;

  const renderAuthModal = () => {
    if (!showAuthModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setShowAuthModal(false)}></div>

        <div className="relative w-full max-w-md glass-panel rounded-2xl p-8 bg-zinc-950 border border-zinc-900 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>

          <div className="mb-6 text-center">
            <h3 className="text-lg font-extrabold text-zinc-100">Candidate Security Portal</h3>
            <p className="text-xs text-zinc-200 mt-1">Verify credentials to proceed securely.</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200/60 text-rose-800 text-xs font-semibold rounded-xl mb-4 text-center">
              {authError}
            </div>
          )}

          {otpSentMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold rounded-xl mb-4 text-center">
              {otpSentMsg}
            </div>
          )}

          {/* Step 1: Input Email */}
          {authStep === 'email' && (
            <form onSubmit={handleAuthEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-200 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-650 focus:outline-none text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="glow-btn w-full py-2.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl flex items-center justify-center"
              >
                {isAuthSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: Login (if candidate has password) */}
          {authStep === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-200 uppercase tracking-wider mb-2">Email</label>
                <input
                  type="text"
                  disabled
                  value={authEmail}
                  className="w-full px-4 py-2.5 bg-zinc-900/40 border border-zinc-900 rounded-xl text-zinc-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-200 uppercase tracking-wider mb-2">Portal Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-4 pr-10 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-650 focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-200 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="glow-btn w-full py-2.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl flex items-center justify-center"
              >
                {isAuthSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Log In'}
              </button>
              <button
                type="button"
                onClick={() => setAuthStep('email')}
                className="w-full text-center text-[10px] text-zinc-200 hover:text-accentPurple mt-2 block"
              >
                Use a different email
              </button>
            </form>
          )}

          {/* Step 3: Register (if new candidate) */}
          {authStep === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-200 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={authFirstName}
                    onChange={(e) => setAuthFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-gray-100 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-200 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={authLastName}
                    onChange={(e) => setAuthLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-gray-100 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-200 uppercase tracking-wider mb-1.5">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-4 pr-10 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-650 focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-200 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-200 uppercase tracking-wider mb-1.5">Verification Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value)}
                    placeholder="123456"
                    className="flex-1 px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-gray-100 text-xs focus:outline-none font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isAuthSubmitting}
                    className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-accentPurple rounded-xl transition-all"
                  >
                    Change Email
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isAuthSubmitting}
                className="glow-btn w-full py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl flex items-center justify-center mt-2"
              >
                {isAuthSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setAuthStep('email')}
                className="w-full text-center text-[10px] text-zinc-200 hover:text-accentPurple mt-2 block"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  // --- RENDERING ROUTER BLOCK ---

  // 1. Loading active assessment params
  if (isJdLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-200">
        <Loader2 className="w-10 h-10 animate-spin text-accentCyan mb-3" />
        <p className="text-xs">Formulating assessment parameters...</p>
      </div>
    );
  }

  // 2. Completed interview state (Submission Modal States)
  if (isFinishing || isDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md">
        {isFinishing ? (
          <div className="w-full max-w-md glass-panel rounded-2xl p-10 text-center space-y-6">
            <Loader2 className="w-16 h-16 text-accentCyan animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-zinc-100">Submitting interview...</h2>
            <p className="text-sm text-zinc-400">Please do not close your browser.</p>
          </div>
        ) : (
          <div className="w-full max-w-md glass-panel rounded-2xl p-10 text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-accentCyan"></div>
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-emerald-400">Interview Completed!</h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              We will let you know the results once the job closing date arrives or if your status changes.
            </p>
            <div className="pt-6 border-t border-zinc-900/60 mt-4">
              <button
                onClick={resetInterviewForm}
                className="glow-btn px-8 py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-sm font-bold rounded-xl transition-all"
              >
                Go to Portal Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Active Webcam Interview console
  if (activeInterviewStarted) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 mb-8 gap-4">
          <div>
            <span className="text-[10px] font-bold text-accentPurple tracking-widest uppercase block">Assessment Pipeline</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to abandon this assessment? Your progress will not be saved.")) {
                resetInterviewForm();
              }
            }}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-accentPurple transition-all"
          >
            Abandon Assessment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-start justify-between gap-3 ${isActive
                        ? 'bg-gradient-to-r from-accentPurple/10 to-accentCyan/5 border-accentPurple/30 text-zinc-100 font-bold'
                        : isCompleted
                          ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400'
                          : 'bg-zinc-950/20 border-zinc-900/40 text-zinc-650 cursor-not-allowed'
                        }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-200 block">Question {idx + 1}</span>
                        <p className="line-clamp-2 pr-1">
                          {idx <= completedUploads.length ? q : "Locked Question"}
                        </p>
                      </div>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0 mt-0.5" />
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
                <p className="text-[10px] text-zinc-200 mt-1 leading-relaxed">
                  Raw recordings are stored ephemerally. Evaluator parsing runs immediately, following which files are completely purged.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-800 text-xs font-semibold">
                Assessment session token is closed, expired, or deactivated. Please contact the recruiter.
              </div>
            )}

            <VideoRecorder
              key={currentQuestionIndex}
              questionText={questions[currentQuestionIndex]}
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              onUploadComplete={handleUploadComplete}
            />


          </div>
        </div>
      </div>
    );
  }

  // 4. JD Preview View (landing page with valid token)
  if (previewJob) {
    const isClosed = !previewJob.is_active;

    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-4xl glass-panel rounded-3xl p-10 md:p-14 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-zinc-900/60 bg-zinc-950/95">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accentPurple via-accentPurple to-accentCyan"></div>

          <div className="flex justify-between items-start border-b border-zinc-900/65 pb-6 mb-8">
            <div>
              <span className="text-xs font-bold text-accentPurple tracking-widest uppercase">Job Invitation</span>
              <h2 className="text-3xl md:text-4xl font-black text-zinc-100 tracking-tight mt-3.5 leading-tight">{previewJob.title}</h2>
              <span className="text-xs text-zinc-550 block font-mono mt-1.5 uppercase tracking-wider">Assessment Token: {previewJob.token}</span>
            </div>

            <span className={`text-[10.5px] font-extrabold px-3 py-1 rounded-md border uppercase tracking-wider ${isClosed
              ? 'bg-zinc-900/80 text-zinc-550 border-zinc-800'
              : 'bg-orange-950/40 text-orange-400 border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.08)]'
              }`}>
              {isClosed ? 'Closed' : 'Active Invitation'}
            </span>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs md:text-sm font-extrabold text-zinc-400 uppercase tracking-wider mb-3">Job Description</h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/25 border border-zinc-900/60 p-5 md:p-6 rounded-2xl">
                {previewJob.description}
              </p>
            </div>

            <div>
              <h3 className="text-xs md:text-sm font-extrabold text-zinc-400 uppercase tracking-wider mb-3">Configure Screening Prompts ({questions.length})</h3>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex gap-4 text-sm bg-zinc-900/10 border border-zinc-900/40 p-4.5 rounded-2xl text-zinc-300 items-center">
                    <span className="w-6 h-6 rounded-lg bg-accentPurple/10 border border-accentPurple/20 flex items-center justify-center font-bold text-accentPurple text-xs flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-8 border-t border-zinc-900/60 flex flex-wrap items-center justify-between gap-4">
              {isClosed ? (
                <div className="bg-rose-50 border border-rose-200/60 rounded-xl text-rose-700 text-xs md:text-sm font-semibold p-4">
                  Warning: Do not exit the full-screen layout or switch browser tabs once you initiate the session. The telemetry logs eye-tracking data, and system focus status dynamically to recruiter dashboards.
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 pt-3">
                  <button
                    onClick={() => setPreviewJob(null)}
                    className="px-5 py-3 text-xs md:text-sm text-zinc-400 hover:text-accentPurple border border-zinc-850 hover:border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900 font-extrabold transition-all rounded-xl cursor-pointer"
                  >
                    Go back
                  </button>
                  <button
                    onClick={() => {
                      if (user && user.role === 'candidate') {
                        handleCheckinAndStart();
                      } else {
                        setAuthStep('email');
                        setAuthEmail('');
                        setAuthPassword('');
                        setAuthOtp('');
                        setAuthError('');
                        setOtpSentMsg('');
                        setShowAuthModal(true);
                      }
                    }}
                    className="glow-btn px-8 py-3.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs md:text-sm font-extrabold rounded-xl flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.01]"
                  >
                    Start Assessment Interview <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {renderAuthModal()}
      </div>
    );
  }

  // 5. Candidate Portal Dashboard (when candidate is logged in but no active job previewed)
  if (user && user.role === 'candidate') {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-5 mb-8 gap-4">
          <div>
            <span className="text-[10px] font-bold text-accentPurple tracking-widest uppercase block">Applicant Portal</span>
            <h1 className="text-2xl font-extrabold text-zinc-100 mt-2 tracking-tight">Welcome, {user.name || user.email}!</h1>
            <p className="text-xs text-zinc-400 mt-1">Review active job submissions and recruiter shortlist outcomes.</p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={fetchCandidateApps}
              className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-accentPurple rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Applied Assessments section */}
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">My Screenings</h2>

        {isLoadingApps ? (
          <div className="py-12 text-center text-zinc-200">
            <Loader2 className="w-8 h-8 animate-spin text-accentCyan mx-auto mb-2" />
            <p className="text-xs">Loading application statuses...</p>
          </div>
        ) : candidateApps.length > 0 ? (
          <div className="space-y-6">
            {candidateApps.map((app) => {
              const status = app.status;
              const isShortlisted = status === 'Shortlisted';

              return (
                <div key={app.submission_id} className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-zinc-900">
                  <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                    <div>
                      <h3 className="text-md font-bold text-gray-200">{app.job_title}</h3>
                      <p className="text-[10px] text-zinc-200 font-mono mt-1">ID: {app.submission_id}</p>
                    </div>

                    {/* Status Pill */}
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-xl border uppercase tracking-wider ${status === 'Pending'
                      ? 'bg-zinc-900 text-zinc-200 border-zinc-800'
                      : status === 'Under Review'
                        ? 'bg-orange-50 text-orange-850 border-orange-200/60'
                        : isShortlisted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                          : 'bg-zinc-900 text-zinc-200 border-zinc-800'
                      }`}>
                      {status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 mb-6 max-w-2xl">{app.job_description}</p>

                  {/* Resume Upload Panel if Shortlisted / Requested */}
                  {app.resume_requested && (
                    <div className="pt-5 border-t border-zinc-900/40 bg-zinc-900/20 p-5 rounded-xl mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-accentPurple" />
                        <h4 className="text-xs font-bold text-gray-200">HR Resume Request</h4>
                      </div>

                      {app.resume_url ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/60 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                            <Check className="w-4 h-4" /> Resume Uploaded & Shared
                          </div>
                          <span className="text-[10px] text-zinc-200 font-mono">Location: {app.resume_url.split('_').slice(1).join('_') || 'resume.pdf'}</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] text-zinc-400 mb-4">The hiring recruiter has requested your resume details. Please upload your document (.pdf) below:</p>

                          <label className="relative border border-dashed border-zinc-800 hover:border-accentCyan/50 bg-zinc-950/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => handleResumeUpload(e, app.submission_id)}
                              className="hidden"
                              disabled={isUploadingResume && uploadingSubId === app.submission_id}
                            />
                            {isUploadingResume && uploadingSubId === app.submission_id ? (
                              <>
                                <Loader2 className="w-8 h-8 animate-spin text-accentCyan mb-2" />
                                <span className="text-[10px] text-zinc-400 font-semibold">Uploading document...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-8 h-8 text-zinc-300 mb-2" />
                                <span className="text-xs font-bold text-gray-300">Click or Drag PDF to Upload</span>
                                <span className="text-[9px] text-zinc-200 mt-1">Files limited to PDF, maximum 5MB</span>
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-10 text-center">
            <ClipboardList className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-xs text-zinc-200">No screen submissions registered.</p>
            <p className="text-[10px] text-zinc-300 mt-1">If you have a job invite code, click the top right button to take an assessment.</p>
          </div>
        )}
        {renderAuthModal()}
      </div>
    );
  }

  // 6. Generic Check-In View (when no url token and not logged in)
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-accentPurple/10 blur-3xl -z-10"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-accentCyan/10 blur-3xl -z-10"></div>

        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>

          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-zinc-100 flex items-center justify-center gap-1.5">
              Candidate Security Portal
            </h2>
            <p className="text-xs text-gray-500 mt-1">Authenticate secure session invite</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200/60 text-xs font-semibold rounded-xl mb-5 text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invite Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="INV-XXXXXX"
                  className="flex-1 px-3 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-accentCyan/50 rounded-xl text-gray-100 placeholder-zinc-300 focus:outline-none text-xs font-mono font-bold"
                />
                <button
                  onClick={() => fetchJdByToken(tokenInput)}
                  disabled={isJdLoading}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-accentPurple rounded-xl transition-all"
                >
                  Verify Code
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900/60 text-center">
              <span className="text-xs text-zinc-200 block mb-3">Or check applied status:</span>
              <button
                onClick={() => {
                  setAuthStep('email');
                  setAuthEmail('');
                  setAuthPassword('');
                  setAuthOtp('');
                  setAuthError('');
                  setOtpSentMsg('');
                  setShowAuthModal(true);
                }}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 rounded-xl text-xs font-bold text-accentCyan hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Candidate Login / Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      {renderAuthModal()}
    </div>
  );
};
