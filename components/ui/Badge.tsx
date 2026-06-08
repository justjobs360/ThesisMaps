import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'muted' | 'primary';

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white text-black border-2 border-black',
  success: 'bg-green-100 text-green-900 border-2 border-black',
  warning: 'bg-yellow-100 text-yellow-900 border-2 border-black',
  danger: 'bg-red-100 text-red-900 border-2 border-black',
  accent: 'bg-accent text-white border-2 border-black',
  primary: 'bg-black text-white border-2 border-black',
  muted: 'bg-white text-black/40 border-2 border-black',
};

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-3 py-1 rounded-none text-[9px] font-black font-sans uppercase tracking-[0.15em] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
