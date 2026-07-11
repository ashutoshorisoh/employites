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
          glowLine: 'from-orange-400 to-orange-600',
          shadow: 'hover:shadow-[0_8px_30px_rgba(255,107,53,0.06)] hover:border-orange-500/25',
          iconBg: 'bg-orange-50 text-accentPurple border-orange-200/50',
        };
      case 'cyan':
        return {
          glowLine: 'from-cyan-400 to-cyan-600',
          shadow: 'hover:shadow-[0_8px_30px_rgba(6,182,212,0.06)] hover:border-cyan-500/25',
          iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/50',
        };
      case 'pink':
        return {
          glowLine: 'from-rose-400 to-rose-600',
          shadow: 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.06)] hover:border-rose-500/25',
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200/50',
        };
      case 'emerald':
        return {
          glowLine: 'from-emerald-400 to-emerald-600',
          shadow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)] hover:border-emerald-500/25',
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
        };
      case 'amber':
        return {
          glowLine: 'from-amber-400 to-amber-600',
          shadow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.06)] hover:border-amber-500/25',
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200/50',
        };
      default:
        return {
          glowLine: 'from-zinc-300 to-zinc-400',
          shadow: 'hover:border-zinc-300',
          iconBg: 'bg-zinc-100 text-zinc-650 border-zinc-200',
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
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight block mt-2">
            {value}
          </span>
        </div>

        <div className={`p-2.5 rounded-xl border ${styles.iconBg}`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
      </div>

      {change && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change}
          </span>
          <span className="text-xs text-zinc-200 font-medium">vs previous period</span>
        </div>
      )}
    </div>
  );
};
