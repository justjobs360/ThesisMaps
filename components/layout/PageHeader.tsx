import React from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-serif text-display-sm text-text-primary leading-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-text-muted font-sans text-sm leading-body">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
