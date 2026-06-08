'use client';

import { useState } from 'react';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState({
    mlGapDetection: true,
    collaboration: true,
    defenceMode: true,
  });

  const [banner, setBanner] = useState({
    enabled: false,
    message: '',
  });

  function toggleFlag(key: keyof typeof flags) {
    setFlags((f) => ({ ...f, [key]: !f[key] }));
  }

  const serviceStatuses = [
    { name: 'ML API', status: 'online' as const },
    { name: 'Semantic Scholar', status: 'online' as const },
    { name: 'OpenAlex', status: 'online' as const },
    { name: 'arXiv', status: 'online' as const },
    { name: 'CrossRef', status: 'online' as const },
    { name: 'Redis Cache', status: 'online' as const },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Platform Settings" />

      {/* Feature Flags */}
      <section aria-labelledby="flags-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <h2 id="flags-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Feature Flags</h2>
        <ul className="space-y-3">
          {(Object.entries(flags) as [keyof typeof flags, boolean][]).map(([key, value]) => (
            <li key={key} className="flex items-center justify-between">
              <span className="text-sm font-sans text-text-primary">
                {key === 'mlGapDetection' ? 'ML Gap Detection' : key === 'collaboration' ? 'Collaboration' : 'Defence Mode'}
              </span>
              <button
                onClick={() => toggleFlag(key)}
                role="switch"
                aria-checked={value}
                className={[
                  'relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                  value ? 'bg-accent' : 'bg-border',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                    value ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </li>
          ))}
        </ul>
        <Button size="sm" variant="primary" className="mt-4">Save flags</Button>
      </section>

      {/* Announcement Banner */}
      <section aria-labelledby="banner-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm space-y-3">
        <h2 id="banner-heading" className="text-sm font-sans font-semibold text-text-primary">Announcement Banner</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm font-sans text-text-primary">Enable banner</span>
          <button
            onClick={() => setBanner((b) => ({ ...b, enabled: !b.enabled }))}
            role="switch"
            aria-checked={banner.enabled}
            className={['relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent', banner.enabled ? 'bg-accent' : 'bg-border'].join(' ')}
          >
            <span className={['absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform', banner.enabled ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
          </button>
        </label>
        <textarea
          value={banner.message}
          onChange={(e) => setBanner((b) => ({ ...b, message: e.target.value }))}
          placeholder="Banner message…"
          rows={2}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
        <Button size="sm" variant="primary">Save banner</Button>
      </section>

      {/* Service Status */}
      <section aria-labelledby="status-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <h2 id="status-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Service Status</h2>
        <ul className="space-y-2">
          {serviceStatuses.map(({ name, status }) => (
            <li key={name} className="flex items-center justify-between">
              <span className="text-sm font-sans text-text-primary">{name}</span>
              <div className="flex items-center gap-1.5">
                {status === 'online'
                  ? <CheckCircle size={14} strokeWidth={1.5} className="text-success" />
                  : <XCircle size={14} strokeWidth={1.5} className="text-danger" />}
                <span className={['text-xs font-sans', status === 'online' ? 'text-success' : 'text-danger'].join(' ')}>
                  {status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Cache */}
      <section aria-labelledby="cache-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <h2 id="cache-heading" className="text-sm font-sans font-semibold text-text-primary mb-2">Cache Management</h2>
        <p className="text-xs text-text-muted font-sans mb-4">Flush all cached API responses from Redis. This will temporarily slow searches until caches rebuild.</p>
        <Button size="sm" variant="danger">Flush Redis Cache</Button>
      </section>
    </div>
  );
}
