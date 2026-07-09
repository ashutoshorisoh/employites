import React, { useState, useEffect } from 'react';
import { KanbanBoard, CandidateCard } from '../components/ui/KanbanBoard';
import { MetricCard } from '../components/ui/MetricCard';
import { 
  Users, Video, ShieldAlert, Award, Star, Search, PlusCircle, 
  FileText, Clipboard, ExternalLink, X, Send, Play, CheckCircle, ChevronRight, ChevronLeft, AlertTriangle, Loader2, Edit, Trash2, Lock, Unlock, Eye, RefreshCw 
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, "");

interface Job {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  department: string;
  token: string;
  questions: string[];
  candidateCount: number;
  isActive: boolean;
}

export const RecruiterDashboard: React.FC = () => {
  const [allCandidates, setAllCandidates] = useState<(CandidateCard & { jobId: string })[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSubTab, setJobSubTab] = useState<'candidates' | 'cheatflags'>('candidates');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateCard | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Job Creator form states
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobQuestions, setNewJobQuestions] = useState<string[]>(['']);
  const [newJobDept, setNewJobDept] = useState('Engineering');
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [createdJobToken, setCreatedJobToken] = useState<string | null>(null);

  // Job Editor form states
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobDesc, setEditJobDesc] = useState('');
  const [editJobQuestions, setEditJobQuestions] = useState<string[]>(['']);
  const [isUpdatingJob, setIsUpdatingJob] = useState(false);

  // Fetch jobs and submissions on mount
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // 1. Fetch all job postings
      const jobsRes = await fetch(`${API_BASE_URL}/jobs`, { headers });
      let fetchedJobs: any[] = [];
      if (jobsRes.ok) {
        fetchedJobs = await jobsRes.json();
        const mappedJobs = fetchedJobs.map((j: any) => ({
          id: j.id,
          title: j.title,
          description: j.description || '',
          requirements: j.requirements || '',
          department: j.description?.includes('department') ? 'Product' : 'Engineering',
          token: j.token || 'N/A',
          questions: Array.isArray(j.questions) ? j.questions : (j.requirements ? [j.requirements] : ['Explain your core skills.']),
          candidateCount: 0,
          isActive: j.is_active !== false
        }));
        setJobs(mappedJobs);
      }

      // 2. Fetch all candidate submissions
      const subRes = await fetch(`${API_BASE_URL}/submissions`, { headers });
      if (subRes.ok) {
        const fetchedSubs = await subRes.json();
        
        // Map submissions to Kanban Candidate Cards with jobId attached
        const mappedCandidates = fetchedSubs.map((s: any) => {
          const feedback = s.ai_feedback || {};
          const summary = feedback.summary || 'AI evaluation enqueued. Processing responses.';
          const transcript = feedback.transcript || 'No transcript processed yet.';
          const alerts = feedback.weaknesses || [];
          
          return {
            id: s.id,
            jobId: s.job_id,
            name: s.candidate_name || 'Unknown Candidate',
            role: s.job_title || 'Applicant',
            scoreCommunication: s.score_communication !== null ? s.score_communication / 10 : 0,
            scoreTechnical: s.score_technical !== null ? s.score_technical / 10 : 0,
            scoreTelemetry: s.score_telemetry !== null ? s.score_telemetry / 10 : 10,
            telemetryAlerts: alerts,
            status: s.status === 'Completed' ? 'Reviewing' : s.status === 'Failed' ? 'Rejected' : 'Applied',
            summary: summary,
            videoUrl: '', // Ephemeral storage enforces zero raw video playback
            transcript: transcript
          };
        });

        // Calculate candidate counts per job
        setJobs(prev => prev.map(job => {
          const count = fetchedSubs.filter((s: any) => s.job_id === job.id).length;
          return { ...job, candidateCount: count };
        }));

        setAllCandidates(mappedCandidates);
      }
    } catch (err) {
      console.error('Failed to load recruiter workspace:', err);
      setErrorMsg('Failed to sync details with active Supabase tables.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-poll every 5 seconds if there are any pending submissions (Applied status)
  useEffect(() => {
    const hasPending = allCandidates.some(c => c.status === 'Applied');
    if (!hasPending) return;

    const interval = setInterval(() => {
      // Background fetch without showing full-page loader
      const fetchSilent = async () => {
        const token = localStorage.getItem('skreener_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        try {
          const subRes = await fetch(`${API_BASE_URL}/submissions`, { headers });
          if (subRes.ok) {
            const fetchedSubs = await subRes.json();
            const mappedCandidates = fetchedSubs.map((s: any) => {
              const feedback = s.ai_feedback || {};
              const summary = feedback.summary || 'AI evaluation enqueued. Processing responses.';
              const transcript = feedback.transcript || 'No transcript processed yet.';
              const alerts = feedback.weaknesses || [];
              
              return {
                id: s.id,
                jobId: s.job_id,
                name: s.candidate_name || 'Unknown Candidate',
                role: s.job_title || 'Applicant',
                scoreCommunication: s.score_communication !== null ? s.score_communication / 10 : 0,
                scoreTechnical: s.score_technical !== null ? s.score_technical / 10 : 0,
                scoreTelemetry: s.score_telemetry !== null ? s.score_telemetry / 10 : 10,
                telemetryAlerts: alerts,
                status: s.status === 'Completed' ? 'Reviewing' : s.status === 'Failed' ? 'Rejected' : 'Applied',
                summary: summary,
                videoUrl: '',
                transcript: transcript
              };
            });

            // Also update job candidate counts
            setJobs(prev => prev.map(job => {
              const count = fetchedSubs.filter((s: any) => s.job_id === job.id).length;
              return { ...job, candidateCount: count };
            }));

            setAllCandidates(mappedCandidates);

            // Update the selected candidate modal state if open, so the detail drawer updates live!
            setSelectedCandidate(prev => {
              if (!prev) return null;
              const updated = mappedCandidates.find((c: any) => c.id === prev.id);
              return updated || prev;
            });
          }
        } catch (err) {
          console.error('Silent poll failed:', err);
        }
      };
      fetchSilent();
    }, 5000);

    return () => clearInterval(interval);
  }, [allCandidates]);

  const handleStatusChange = async (id: string, newStatus: CandidateCard['status']) => {
    setAllCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    
    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const dbStatus = newStatus === 'Reviewing' ? 'Completed' : newStatus === 'Rejected' ? 'Failed' : 'Pending';
      await fetch(`${API_BASE_URL}/submissions/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ status: dbStatus })
      });
    } catch (err) {
      console.error('Failed to update candidate status on server:', err);
    }
  };

  // Helper methods to modify creation questions array
  const handleAddNewQuestion = () => {
    setNewJobQuestions(prev => [...prev, '']);
  };

  const handleNewQuestionChange = (index: number, value: string) => {
    setNewJobQuestions(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveNewQuestion = (index: number) => {
    if (newJobQuestions.length <= 1) return;
    setNewJobQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  // Helper methods to modify editing questions array
  const handleAddEditQuestion = () => {
    setEditJobQuestions(prev => [...prev, '']);
  };

  const handleEditQuestionChange = (index: number, value: string) => {
    setEditJobQuestions(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveEditQuestion = (index: number) => {
    if (editJobQuestions.length <= 1) return;
    setEditJobQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeQuestions = newJobQuestions.filter(q => q.trim() !== '');
    if (!newJobTitle || !newJobDesc || activeQuestions.length === 0) return;

    setIsCreatingJob(true);
    setErrorMsg('');
    setCreatedJobToken(null);

    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          title: newJobTitle,
          description: newJobDesc,
          questions: activeQuestions
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save job posting.');
      }

      const savedJob = await res.json();
      
      const newJob: Job = {
        id: savedJob.id,
        title: savedJob.title,
        description: savedJob.description || '',
        requirements: savedJob.requirements || '',
        department: newJobDept,
        token: savedJob.token,
        questions: savedJob.questions || activeQuestions,
        candidateCount: 0,
        isActive: true
      };

      setJobs(prev => [newJob, ...prev]);
      setCreatedJobToken(savedJob.token);

      // Reset fields
      setNewJobTitle('');
      setNewJobDesc('');
      setNewJobQuestions(['']);
    } catch (err: any) {
      console.error('Job formulation error:', err);
      setErrorMsg(err.message || 'Failed to create job posting.');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update job status.');
      }

      const updated = await res.json();
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isActive: updated.is_active } : j));
    } catch (err) {
      console.error('Error toggling job status:', err);
      alert('Failed to update job status.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job listing? Candidates will no longer be able to access it.')) {
      return;
    }

    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!res.ok) {
        throw new Error('Failed to delete job listing.');
      }

      setJobs(prev => prev.filter(j => j.id !== jobId));
      // If the deleted job was currently open in Kanban, close it
      if (selectedJobId === jobId) {
        setSelectedJobId(null);
      }
      alert('Job listing deleted successfully.');
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job listing.');
    }
  };

  const handleEditJobClick = (job: Job) => {
    setEditingJob(job);
    setEditJobTitle(job.title);
    setEditJobDesc(job.description || '');
    setEditJobQuestions(job.questions.length > 0 ? [...job.questions] : ['']);
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeQuestions = editJobQuestions.filter(q => q.trim() !== '');
    if (!editingJob || !editJobTitle || !editJobDesc || activeQuestions.length === 0) return;

    setIsUpdatingJob(true);
    const token = localStorage.getItem('skreener_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          title: editJobTitle,
          description: editJobDesc,
          questions: activeQuestions
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update job details.');
      }

      const updated = await res.json();
      setJobs(prev => prev.map(j => j.id === editingJob.id ? {
        ...j,
        title: updated.title,
        description: updated.description,
        requirements: updated.requirements,
        questions: updated.questions || activeQuestions
      } : j));

      setEditingJob(null);
      alert('Job details updated successfully.');
    } catch (err) {
      console.error('Error updating job details:', err);
      alert('Failed to update job details.');
    } finally {
      setIsUpdatingJob(false);
    }
  };

  // Candidates filtered by selected job
  const jobCandidates: CandidateCard[] = selectedJobId
    ? allCandidates.filter(c => c.jobId === selectedJobId)
    : [];
  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  // Per-job metrics (only meaningful when a job is selected)
  const jobTotalEvaluations = jobCandidates.length;
  const jobAnomaliesCount = jobCandidates.filter(c => c.scoreTelemetry < 5).length;
  const jobAvgComm = jobCandidates.length > 0 
    ? (jobCandidates.reduce((sum, c) => sum + c.scoreCommunication, 0) / jobCandidates.length).toFixed(1) 
    : '0';
  const jobAvgTech = jobCandidates.length > 0 
    ? (jobCandidates.reduce((sum, c) => sum + c.scoreTechnical, 0) / jobCandidates.length).toFixed(1) 
    : '0';

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin text-accentPurple mb-3" />
        <p className="text-xs">Synchronizing recruiter metrics with Supabase database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold mb-6">
          {errorMsg}
        </div>
      )}



      {/* Per-Job View (when a job is selected) */}
      {selectedJobId && selectedJob && (
        <div>
          <button
            onClick={() => { setSelectedJobId(null); setJobSubTab('candidates'); }}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white mb-5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to All Jobs
          </button>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-extrabold text-white">{selectedJob.title}</h2>
            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
              selectedJob.isActive
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}>
              {selectedJob.isActive ? 'Active' : 'Closed'}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded">{selectedJob.token}</span>
            <span className="text-[10px] text-zinc-500 font-bold">{jobCandidates.length} candidate{jobCandidates.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Job-specific stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            <MetricCard title="Completed Screens" value={jobTotalEvaluations} icon={Users} glowColor="purple" />
            <MetricCard title="Avg Tech Fluency" value={`${jobAvgTech}/10`} icon={Award} glowColor="cyan" />
            <MetricCard title="Avg Communication" value={`${jobAvgComm}/10`} icon={Star} glowColor="pink" />
            <MetricCard title="Telemetry Alerts" value={jobAnomaliesCount} icon={ShieldAlert} glowColor="amber" change={`${jobAnomaliesCount} flagged`} isPositive={false} />
          </div>

          {/* Sub-tabs: Candidates / Cheat Flags */}
          <div className="flex gap-1 bg-zinc-950/80 border border-zinc-900 rounded-xl p-1 w-fit mb-6">
            <button
              onClick={() => setJobSubTab('candidates')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                jobSubTab === 'candidates' ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Candidate Board
            </button>
            <button
              onClick={() => setJobSubTab('cheatflags')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                jobSubTab === 'cheatflags' ? 'bg-gradient-to-r from-accentPurple to-accentCyan text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cheat Flags ({jobAnomaliesCount})
            </button>
          </div>

          {/* Candidate Board sub-tab */}
          {jobSubTab === 'candidates' && (
            <>
              {jobCandidates.length > 0 ? (
                <KanbanBoard
                  candidates={jobCandidates}
                  onStatusChange={handleStatusChange}
                  onSelectCandidate={setSelectedCandidate}
                />
              ) : (
                <div className="glass-panel rounded-2xl p-10 text-center">
                  <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500">No candidate submissions for this job yet.</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Share the invite code <span className="text-accentCyan font-mono font-bold">{selectedJob.token}</span> with candidates to start receiving responses.</p>
                </div>
              )}
            </>
          )}

          {/* Cheat Flags sub-tab */}
          {jobSubTab === 'cheatflags' && (
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-md font-bold text-gray-200 mb-4 flex items-center gap-2">
                Security Flags for {selectedJob.title} <ShieldAlert className="w-5 h-5 text-amber-500" />
              </h3>
              <div className="space-y-4">
                {jobCandidates.filter(c => c.telemetryAlerts.length > 0).map(c => (
                  <div key={c.id} className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-200">{c.name} — {c.role}</h4>
                      <ul className="list-disc pl-4 text-[11px] text-zinc-400 space-y-1">
                        {c.telemetryAlerts.map((alert, idx) => (
                          <li key={idx} className="text-rose-400 font-semibold">{alert}</li>
                        ))}
                      </ul>
                      <span className="text-[10px] text-zinc-500 block pt-1">Telemetry Integrity Score: {c.scoreTelemetry * 10}/100</span>
                    </div>
                  </div>
                ))}
                {jobCandidates.filter(c => c.telemetryAlerts.length > 0).length === 0 && (
                  <p className="text-xs text-zinc-500">No security telemetry anomalies flagged for this job's screenings.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Job Cards Grid (when no job is selected) */}
      {!selectedJobId && (
        <>
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accentCyan" /> Sync Board
          </button>
          <button
            onClick={() => {
              setCreatedJobToken(null);
              setNewJobQuestions(['']);
              setShowJobModal(true);
            }}
            className="glow-btn px-4.5 py-2.5 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Post a New Job
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map(job => {
            const jobCount = allCandidates.filter(c => c.jobId === job.id).length;
            return (
              <div key={job.id} className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group">
                <div>
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-md text-gray-200">{job.title}</h3>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          job.isActive 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}>
                          {job.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{job.department}</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 font-bold">
                      {jobCount} Screened
                    </span>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Configured Prompts</span>
                    {job.questions.map((q, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-gray-400 bg-zinc-950/40 border border-zinc-900/60 p-2.5 rounded-lg">
                        <span className="text-accentPurple font-bold">{idx + 1}.</span>
                        <p className="line-clamp-2">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {/* View Candidates Button */}
                  <button
                    onClick={() => setSelectedJobId(job.id)}
                    className="w-full mb-4 py-2.5 bg-gradient-to-r from-accentPurple/10 to-accentCyan/10 hover:from-accentPurple/20 hover:to-accentCyan/20 border border-accentPurple/20 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-accentCyan" /> View {jobCount} Candidate{jobCount !== 1 ? 's' : ''}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Recruiter Actions */}
                  <div className="flex gap-2 mb-4 justify-end border-t border-zinc-900 pt-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditJobClick(job); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white bg-zinc-950 border border-zinc-900 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Edit className="w-3 h-3 text-accentPurple" /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleJobStatus(job.id, job.isActive); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white bg-zinc-950 border border-zinc-900 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {job.isActive ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-500" /> Close
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-500" /> Open
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                    </button>
                  </div>

                  {/* Invitation Token */}
                  <div className="bg-zinc-950/20 px-3 py-2.5 rounded-xl border border-zinc-900 flex justify-between items-center">
                    <div>
                      <span className="block text-[8px] font-bold text-gray-500 uppercase">Invite Code</span>
                      <span className="text-xs font-mono font-bold text-accentCyan uppercase">{job.token}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(job.token);
                        alert(`Invite Code ${job.token} copied to clipboard!`);
                      }}
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white"
                    >
                      <Clipboard className="w-3.5 h-3.5" /> Copy Code
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}



      {/* Candidate Profile Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedCandidate(null)}></div>
          
          <div className="relative w-full max-w-2xl h-full bg-zinc-950 border-l border-zinc-900 p-8 overflow-y-auto flex flex-col justify-between shadow-2xl z-10">
            <div>
              <div className="flex justify-between items-start pb-5 border-b border-zinc-900 mb-6">
                <div>
                  <span className="text-[10px] font-extrabold text-accentPurple uppercase tracking-widest bg-accentPurple/10 border border-accentPurple/20 px-2 py-0.5 rounded">
                    Evaluation Dashboard
                  </span>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight mt-2">{selectedCandidate.name}</h2>
                  <p className="text-xs text-zinc-400 mt-1">Role Applied: {selectedCandidate.role}</p>
                </div>
                <button 
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ephemeral Video Storage Notice */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 mb-5 flex items-center gap-3 relative overflow-hidden">
                <ShieldAlert className="w-5 h-5 text-accentPurple" />
                <div>
                  <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Ephemeral Video Storage Policy</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">The candidate's raw video file was securely purged from storage immediately after transcription and score parsing.</p>
                </div>
              </div>

              {/* AI Scores Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 text-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Technical Skills</span>
                  <span className="text-xl font-extrabold text-accentCyan">{selectedCandidate.scoreTechnical * 10}/100</span>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 text-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Communication</span>
                  <span className="text-xl font-extrabold text-accentPurple">{selectedCandidate.scoreCommunication * 10}/100</span>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 text-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Anti-Cheat Score</span>
                  <span className={`text-xl font-extrabold ${selectedCandidate.scoreTelemetry < 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedCandidate.scoreTelemetry * 10}/100
                  </span>
                </div>
              </div>

              {/* AI Verbal Transcript */}
              <div className="space-y-2 mb-5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">AI Verbal Transcript</span>
                <div className="text-xs text-gray-300 leading-relaxed bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl max-h-48 overflow-y-auto font-mono whitespace-pre-line">
                  {selectedCandidate.transcript || "No transcript available."}
                </div>
              </div>

              {/* AI Analysis Summary */}
              <div className="space-y-2 mb-6">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">AI Executive Summary</span>
                <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/20 border border-zinc-900/60 p-4 rounded-xl">
                  {selectedCandidate.summary}
                </p>
              </div>

              {/* Telemetry Alert List */}
              {selectedCandidate.telemetryAlerts.length > 0 && (
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Integrity Flag Warnings</span>
                  <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4 space-y-2">
                    {selectedCandidate.telemetryAlerts.map((alert, idx) => (
                      <div key={idx} className="flex gap-2 text-xs text-rose-300">
                        <span className="font-bold">•</span>
                        <span>{alert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
              <span className="text-xs text-zinc-500">Manual review overrides:</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    handleStatusChange(selectedCandidate.id, 'Rejected');
                    setSelectedCandidate(null);
                  }}
                  className="px-4 py-2 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-xs font-bold rounded-xl transition-all"
                >
                  Reject
                </button>
                <button 
                  onClick={() => {
                    handleStatusChange(selectedCandidate.id, 'Shortlisted');
                    setSelectedCandidate(null);
                  }}
                  className="glow-btn px-4.5 py-2 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-bold rounded-xl"
                >
                  Shortlist Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Modal Overlay */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setShowJobModal(false)}></div>
          <form onSubmit={handleCreateJob} className="relative glass-panel rounded-2xl w-full max-w-lg p-6 overflow-hidden shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <h3 className="font-extrabold text-md text-white">Post a New Job Listing</h3>
              <button type="button" onClick={() => setShowJobModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdJobToken && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Job Listing Created Successfully!</h4>
                <p className="text-[11px] text-zinc-400">Share this unique invitation token with candidates to start async video evaluations:</p>
                <div className="flex items-center justify-center gap-3 bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg max-w-xs mx-auto">
                  <span className="text-sm font-mono font-bold text-accentCyan">{createdJobToken}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdJobToken);
                      alert('Token copied!');
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Title</label>
              <input
                type="text"
                required
                value={newJobTitle}
                onChange={e => setNewJobTitle(e.target.value)}
                placeholder="Senior Backend Engineer"
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-accentPurple/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Job Description</label>
              <textarea
                required
                value={newJobDesc}
                onChange={e => setNewJobDesc(e.target.value)}
                placeholder="Build robust Python/FastAPI servers, design microservices, configure databases..."
                rows={3}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 text-xs focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessment Questions</label>
                <button
                  type="button"
                  onClick={handleAddNewQuestion}
                  className="text-[10px] font-bold text-accentCyan hover:text-white flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" /> Add Question
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {newJobQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={q}
                      onChange={e => handleNewQuestionChange(idx, e.target.value)}
                      placeholder={`Question Prompt ${idx + 1}`}
                      className="flex-1 px-4 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 text-xs focus:outline-none"
                    />
                    {newJobQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveNewQuestion(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold px-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Department Name</label>
              <input
                type="text"
                required
                value={newJobDept}
                onChange={e => setNewJobDept(e.target.value)}
                placeholder="Engineering"
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingJob}
              className="glow-btn w-full py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {isCreatingJob ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving job to Supabase...
                </>
              ) : (
                'Formulate & Save Job Listing'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Edit Job Modal Overlay */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setEditingJob(null)}></div>
          <form onSubmit={handleUpdateJob} className="relative glass-panel rounded-2xl w-full max-w-lg p-6 overflow-hidden shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accentPurple to-accentCyan"></div>
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <h3 className="font-extrabold text-md text-white">Edit Job details</h3>
              <button type="button" onClick={() => setEditingJob(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Title</label>
              <input
                type="text"
                required
                value={editJobTitle}
                onChange={e => setEditJobTitle(e.target.value)}
                placeholder="Senior Backend Engineer"
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Job Description</label>
              <textarea
                required
                value={editJobDesc}
                onChange={e => setEditJobDesc(e.target.value)}
                placeholder="Build robust Python/FastAPI servers, design microservices, configure databases..."
                rows={3}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 text-xs focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Assessment Questions</label>
                <button
                  type="button"
                  onClick={handleAddEditQuestion}
                  className="text-[10px] font-bold text-accentCyan hover:text-white flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" /> Add Question
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {editJobQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={q}
                      onChange={e => handleEditQuestionChange(idx, e.target.value)}
                      placeholder={`Question Prompt ${idx + 1}`}
                      className="flex-1 px-4 py-2 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 text-xs focus:outline-none"
                    />
                    {editJobQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEditQuestion(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold px-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingJob}
              className="glow-btn w-full py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {isUpdatingJob ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving changes to Supabase...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
