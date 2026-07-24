'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

type FeatureFlags = { ml_gap_detection: boolean; collaboration: boolean; defence_mode: boolean };
type Banner = { enabled: boolean; message: string };
type Service = { name: string; status: 'online' | 'offline' | 'not_configured'; latencyMs?: number };

const FLAG_LABELS: Record<keyof FeatureFlags, string> = {
  ml_gap_detection: 'ML Gap Detection',
  collaboration: 'Collaboration',
  defence_mode: 'Defence Mode',
};

export default function AdminSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlags>({ ml_gap_detection: true, collaboration: true, defence_mode: true });
  const [banner, setBanner] = useState<Banner>({ enabled: false, message: '' });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [saving, setSaving] = useState<'flags' | 'banner' | null>(null);
  const [flushing, setFlushing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<{ featureFlags: FeatureFlags; announcementBanner: Banner }>('/api/admin/settings')
      .then((data) => {
        setFlags(data.featureFlags);
        setBanner(data.announcementBanner);
      })
      .catch(() => setNotice('Failed to load settings'))
      .finally(() => setLoading(false));

    apiClient
      .get<{ services: Service[] }>('/api/admin/health')
      .then((data) => setServices(data.services))
      .catch(() => setServices([]))
      .finally(() => setHealthLoading(false));
  }, []);

  function toggleFlag(key: keyof FeatureFlags) {
    setFlags((f) => ({ ...f, [key]: !f[key] }));
  }

  async function saveFlags() {
    setSaving('flags');
    setNotice(null);
    try {
      await apiClient.patch('/api/admin/settings', { featureFlags: flags });
      setNotice('Feature flags saved.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  async function saveBanner() {
    setSaving('banner');
    setNotice(null);
    try {
      await apiClient.patch('/api/admin/settings', { announcementBanner: banner });
      setNotice('Banner saved.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  async function flushCache() {
    setFlushing(true);
    setNotice(null);
    try {
      await apiClient.del('/api/admin/cache');
      setNotice('Redis cache flushed.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Flush failed');
    } finally {
      setFlushing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Platform Settings" />

      {notice ? <p className="text-sm font-sans text-text-primary bg-surface border border-border rounded px-3 py-2">{notice}</p> : null}

      {/* Feature Flags */}
      <section aria-labelledby="flags-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <h2 id="flags-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Feature Flags</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <ul className="space-y-3">
              {(Object.keys(FLAG_LABELS) as (keyof FeatureFlags)[]).map((key) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-sm font-sans text-text-primary">{FLAG_LABELS[key]}</span>
                  <button
                    onClick={() => toggleFlag(key)}
                    role="switch"
                    aria-checked={flags[key]}
                    className={[
                      'relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
                      flags[key] ? 'bg-accent' : 'bg-border',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                        flags[key] ? 'translate-x-5' : 'translate-x-0',
                      ].join(' ')}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="primary" className="mt-4" onClick={saveFlags} loading={saving === 'flags'}>
              Save flags
            </Button>
          </>
        )}
      </section>

      {/* Announcement Banner */}
      <section aria-labelledby="banner-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm space-y-3">
        <h2 id="banner-heading" className="text-sm font-sans font-semibold text-text-primary">Announcement Banner</h2>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
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
            <Button size="sm" variant="primary" onClick={saveBanner} loading={saving === 'banner'}>
              Save banner
            </Button>
          </>
        )}
      </section>

      {/* Service Status */}
      <section aria-labelledby="status-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <h2 id="status-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Service Status</h2>
        {healthLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : services.length === 0 ? (
          <p className="text-sm font-sans text-text-muted">Health check unavailable.</p>
        ) : (
          <ul className="space-y-2">
            {services.map(({ name, status, latencyMs }) => (
              <li key={name} className="flex items-center justify-between">
                <span className="text-sm font-sans text-text-primary">{name}</span>
                <div className="flex items-center gap-1.5">
                  {status === 'online' ? (
                    <CheckCircle size={14} strokeWidth={1.5} className="text-success" />
                  ) : status === 'offline' ? (
                    <XCircle size={14} strokeWidth={1.5} className="text-danger" />
                  ) : (
                    <MinusCircle size={14} strokeWidth={1.5} className="text-text-muted" />
                  )}
                  <span className={['text-xs font-sans', status === 'online' ? 'text-success' : status === 'offline' ? 'text-danger' : 'text-text-muted'].join(' ')}>
                    {status === 'not_configured' ? 'not configured' : status}
                    {latencyMs != null ? ` · ${latencyMs}ms` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Cache */}
      <section aria-labelledby="cache-heading" className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <h2 id="cache-heading" className="text-sm font-sans font-semibold text-text-primary mb-2">Cache Management</h2>
        <p className="text-xs text-text-muted font-sans mb-4">Flush all cached API responses from Redis. This will temporarily slow searches until caches rebuild.</p>
        <Button size="sm" variant="danger" onClick={flushCache} loading={flushing}>
          Flush Redis Cache
        </Button>
      </section>
    </div>
  );
}
