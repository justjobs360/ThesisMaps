import React from 'react';

type SkeletonProps = {
  className?: string;
  lines?: number;
};

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={['animate-pulse bg-black/10', className].join(' ')}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={['space-y-2', className].join(' ')} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={['h-4', i === lines - 1 ? 'w-3/4' : 'w-full'].join(' ')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={['border-2 border-black bg-white p-4 space-y-3', className].join(' ')} aria-hidden="true">
      <Skeleton className="h-5 w-4/5" />
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}
