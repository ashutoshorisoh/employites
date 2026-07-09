import React, { useState } from 'react';
import { User, ShieldAlert, Award, Star, Video, Eye, ArrowRight, ArrowLeft } from 'lucide-react';

export interface CandidateCard {
  id: string;
  name: string;
  role: string;
  scoreCommunication: number;
  scoreTechnical: number;
  scoreTelemetry: number; // Integrity/Cheating rating
  telemetryAlerts: string[];
  status: 'Applied' | 'Reviewing' | 'Shortlisted' | 'Rejected';
  avatarUrl?: string;
  videoUrl?: string;
  summary?: string;
  transcript?: string;
}

interface KanbanBoardProps {
  candidates: CandidateCard[];
  onStatusChange: (id: string, newStatus: CandidateCard['status']) => void;
  onSelectCandidate: (candidate: CandidateCard) => void;
}

const COLUMNS: { id: CandidateCard['status']; label: string; color: string }[] = [
  { id: 'Applied', label: 'Screening Complete', color: 'border-l-indigo-500' },
  { id: 'Reviewing', label: 'Under Review', color: 'border-l-cyan-500' },
  { id: 'Shortlisted', label: 'Shortlisted', color: 'border-l-emerald-500' },
  { id: 'Rejected', label: 'Archived', color: 'border-l-rose-500' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ candidates, onStatusChange, onSelectCandidate }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: CandidateCard['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onStatusChange(id, status);
    }
  };

  // Safe navigation fallback for standard click transfers in mobile/keyboards
  const moveCard = (id: string, dir: 'next' | 'prev', current: CandidateCard['status']) => {
    const statuses: CandidateCard['status'][] = ['Applied', 'Reviewing', 'Shortlisted', 'Rejected'];
    const idx = statuses.indexOf(current);
    if (dir === 'next' && idx < statuses.length - 1) {
      onStatusChange(id, statuses[idx + 1]);
    } else if (dir === 'prev' && idx > 0) {
      onStatusChange(id, statuses[idx - 1]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      {COLUMNS.map((col) => {
        const colCandidates = candidates.filter((c) => c.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 min-h-[500px] transition-all"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  col.id === 'Applied' ? 'bg-indigo-500' :
                  col.id === 'Reviewing' ? 'bg-cyan-500' :
                  col.id === 'Shortlisted' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
                <h3 className="text-sm font-bold text-gray-200">{col.label}</h3>
              </div>
              <span className="text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold rounded-full">
                {colCandidates.length}
              </span>
            </div>

            {/* List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {colCandidates.map((candidate) => {
                const avgScore = ((candidate.scoreCommunication + candidate.scoreTechnical) / 2).toFixed(1);
                const hasAnomaly = candidate.scoreTelemetry < 5;

                return (
                  <div
                    key={candidate.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidate.id)}
                    onDragEnd={handleDragEnd}
                    className={`glass-panel border-l-4 ${col.color} rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-r hover:border-r-zinc-800 transition-all duration-200 relative group ${
                      draggedId === candidate.id ? 'opacity-40 scale-95' : 'opacity-100 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Anomaly banner */}
                    {hasAnomaly && (
                      <div className="absolute top-2 right-2 flex items-center justify-center text-rose-500" title="Telemetry Alert Triggered">
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                      </div>
                    )}

                    <h4 className="font-bold text-sm text-gray-100 pr-5 truncate group-hover:text-accentPurple transition-colors">
                      {candidate.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{candidate.role}</p>

                    {/* Scores Section */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-900/60 text-center">
                      <div>
                        <span className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Comm</span>
                        <span className="text-xs font-bold text-indigo-400">{candidate.scoreCommunication}/10</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Tech</span>
                        <span className="text-xs font-bold text-cyan-400">{candidate.scoreTechnical}/10</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Integrity</span>
                        <span className={`text-xs font-bold ${hasAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {candidate.scoreTelemetry}/10
                        </span>
                      </div>
                    </div>

                    {/* Actions and details button */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-900/60">
                      <button
                        onClick={() => onSelectCandidate(candidate)}
                        className="text-[11px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Analysis
                      </button>

                      {/* Direction shifts */}
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {col.id !== 'Applied' && (
                          <button
                            onClick={() => moveCard(candidate.id, 'prev', col.id)}
                            className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
                            title="Move back"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {col.id !== 'Rejected' && (
                          <button
                            onClick={() => moveCard(candidate.id, 'next', col.id)}
                            className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
                            title="Move forward"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {colCandidates.length === 0 && (
                <div className="h-32 border border-dashed border-zinc-900 rounded-xl flex items-center justify-center text-center p-4">
                  <span className="text-xs text-zinc-600 font-medium">Drag items here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
