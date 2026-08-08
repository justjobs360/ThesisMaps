'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';

type AiResultModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Request in flight. */
  loading: boolean;
  /** Message to show instead of content when the request failed. */
  error?: string | null;
  /** False when OPENAI_API_KEY isn't configured — shows a setup hint. */
  aiAvailable?: boolean;
  loadingLabel?: string;
  maxWidth?: string;
  children?: React.ReactNode;
};

/**
 * Shared shell for OpenAI-backed panels (gap deep-dive, paper insight, outline
 * suggestions). Centralises the loading / error / "no key configured" states so
 * every AI surface behaves identically.
 */
export function AiResultModal({
  open,
  onClose,
  title,
  description,
  loading,
  error,
  aiAvailable = true,
  loadingLabel = 'Generating personalized analysis…',
  maxWidth = 'max-w-2xl',
  children,
}: AiResultModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} maxWidth={maxWidth}>
      {loading ? (
        <div className="space-y-3 py-6" role="status" aria-live="polite">
          <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/50 animate-pulse">
            {loadingLabel}
          </p>
          <div className="h-3 bg-black/10 w-3/4" />
          <div className="h-3 bg-black/10 w-full" />
          <div className="h-3 bg-black/10 w-5/6" />
        </div>
      ) : error ? (
        <div className="py-4">
          <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Analysis failed</p>
          <p className="text-xs text-black/50 font-sans mt-1">{error}</p>
        </div>
      ) : (
        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {!aiAvailable ? (
            <div className="border-2 border-black bg-accent/5 p-3">
              <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black">
                AI analysis not configured
              </p>
              <p className="text-xs text-black/60 font-sans mt-1">
                Add <code className="font-mono text-accent">OPENAI_API_KEY</code> to{' '}
                <code className="font-mono">.env</code> and restart the server for a specific,
                paper-grounded breakdown here.
              </p>
            </div>
          ) : null}
          {children}
        </div>
      )}
    </Modal>
  );
}

/** Numbered list used across AI panels. */
export function AiList({ heading, items, accent }: { heading: string; items: string[]; accent?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/50 mb-2">{heading}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-black font-sans leading-snug">
            <span className={['font-black flex-shrink-0', accent ? 'text-accent' : 'text-black'].join(' ')}>
              {i + 1}.
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
