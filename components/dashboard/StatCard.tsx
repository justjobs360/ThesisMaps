import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
};

export function StatCard({ label, value, trend, trendLabel }: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div className="bg-surface border border-border rounded-md p-5 shadow-sm">
      <p className="text-xs font-sans font-medium text-text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-2 font-serif text-3xl text-text-primary leading-tight">{value.toLocaleString()}</p>
      {trend !== undefined ? (
        <div className="mt-2 flex items-center gap-1 text-xs font-sans">
          {isPositive ? (
            <TrendingUp size={12} strokeWidth={1.5} className="text-success" />
          ) : isNegative ? (
            <TrendingDown size={12} strokeWidth={1.5} className="text-danger" />
          ) : (
            <Minus size={12} strokeWidth={1.5} className="text-text-muted" />
          )}
          <span className={isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-text-muted'}>
            {trend > 0 ? '+' : ''}{trend}%{trendLabel ? ` ${trendLabel}` : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}
