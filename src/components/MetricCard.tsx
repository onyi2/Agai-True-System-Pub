import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  subtext?: string;
  color?: 'emerald' | 'gold' | 'danger' | 'sky';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  trend,
  trendType = 'neutral',
  icon: Icon,
  subtext,
  color = 'emerald',
  onClick
}) => {
  const isUp = trendType === 'up';
  const isDown = trendType === 'down';

  const colorStyles = {
    emerald: {
      text: 'text-brand-emerald',
      bg: 'bg-brand-emerald/10',
      border: 'border-brand-emerald/20 hover:border-brand-emerald/40',
      badge: 'bg-brand-emerald/15 text-brand-emerald',
      glow: 'shadow-[0_0_20px_rgba(0,212,165,0.05)]'
    },
    gold: {
      text: 'text-brand-gold',
      bg: 'bg-brand-gold/10',
      border: 'border-brand-gold/20 hover:border-brand-gold/40',
      badge: 'bg-brand-gold/15 text-brand-gold',
      glow: 'shadow-[0_0_20px_rgba(255,184,76,0.05)]'
    },
    danger: {
      text: 'text-brand-danger',
      bg: 'bg-brand-danger/10',
      border: 'border-brand-danger/20 hover:border-brand-danger/40',
      badge: 'bg-brand-danger/15 text-brand-danger',
      glow: 'shadow-[0_0_20px_rgba(255,91,91,0.05)]'
    },
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20 hover:border-sky-500/40',
      badge: 'bg-sky-500/15 text-sky-400',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.05)]'
    }
  };

  const currentStyles = colorStyles[color];

  return (
    <motion.div
      id={id}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`relative p-5 rounded-xl bg-brand-card border ${currentStyles.border} ${currentStyles.glow} transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-light/60 font-display">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-2 font-display text-white">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${currentStyles.bg} ${currentStyles.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold ${currentStyles.badge}`}>
            {isUp && <ArrowUpRight className="w-3.5 h-3.5" />}
            {isDown && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend}
          </span>
        )}
        {subtext && (
          <span className="text-xs text-brand-light/40 font-medium">
            {subtext}
          </span>
        )}
      </div>
    </motion.div>
  );
};
