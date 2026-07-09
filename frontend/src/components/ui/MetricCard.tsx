import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  glowColor?: 'purple' | 'cyan' | 'pink' | 'emerald' | 'amber';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  glowColor = 'purple',
}) => {
  const getGlowStyles = () => {
    switch (glowColor) {
      case 'purple':
        return {
          glowLine: 'from-purple-500/60 to-indigo-600/40',
          shadow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-purple-500/30',
          iconBg: 'bg-purple-950/50 text-purple-400 border-purple-500/20',
        };
      case 'cyan':
        return {
          glowLine: 'from-cyan-500/60 to-blue-600/40',
          shadow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:border-cyan-500/30',
          iconBg: 'bg-cyan-950/50 text-cyan-400 border-cyan-500/20',
        };
      case 'pink':
        return {
          glowLine: 'from-pink-500/60 to-rose-600/40',
          shadow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] hover:border-pink-500/30',
          iconBg: 'bg-pink-950/50 text-pink-400 border-pink-500/20',
        };
      case 'emerald':
        return {
          glowLine: 'from-emerald-500/60 to-teal-600/40',
          shadow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:border-emerald-500/30',
          iconBg: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/20',
        };
      case 'amber':
        return {
          glowLine: 'from-amber-500/60 to-yellow-600/40',
          shadow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-500/30',
          iconBg: 'bg-amber-950/50 text-amber-400 border-amber-500/20',
        };
      default:
        return {
          glowLine: 'from-zinc-800 to-zinc-900',
          shadow: 'hover:border-zinc-700',
          iconBg: 'bg-zinc-900 text-zinc-400 border-zinc-800',
        };
    }
  };

  const styles = getGlowStyles();

  return (
    <div className={`glass-panel rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${styles.shadow}`}>
      {/* Dynamic top gradient line */}
      <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${styles.glowLine}`}></div>

      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-gray-100 tracking-tight block mt-2">
            {value}
          </span>
        </div>

        <div className={`p-2.5 rounded-xl border ${styles.iconBg}`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {change}
          </span>
          <span className="text-xs text-gray-500 font-medium">vs previous period</span>
        </div>
      )}
    </div>
  );
};
