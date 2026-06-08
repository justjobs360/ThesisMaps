import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted';

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface text-text-primary border border-border',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  accent: 'bg-accent/10 text-accent border border-accent/20',
  muted: 'bg-surface text-text-muted border border-border',
};

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-sans',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
