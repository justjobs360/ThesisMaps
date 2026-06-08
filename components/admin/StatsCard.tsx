import React from 'react';

type StatsCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
};

export function StatsCard({ label, value, sub, icon }: StatsCardProps) {
  return (
    <div className="bg-surface border border-border rounded-md p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-sans font-medium text-text-muted uppercase tracking-wide">{label}</p>
        {icon ? <span className="text-text-muted">{icon}</span> : null}
      </div>
      <p className="mt-2 font-serif text-3xl text-text-primary leading-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub ? <p className="mt-1 text-xs text-text-muted font-sans">{sub}</p> : null}
    </div>
  );
}
