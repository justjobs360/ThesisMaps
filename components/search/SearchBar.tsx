'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
};

export function SearchBar({ value, onChange, onSubmit, placeholder = 'Search papers, topics, authors…', loading }: SearchBarProps) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full">
      <label htmlFor="paper-search" className="sr-only">Search academic papers</label>
      <Search
        size={18}
        strokeWidth={2}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-black pointer-events-none"
        aria-hidden
      />
      <input
        id="paper-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pl-12 pr-12 border-2 border-black bg-white text-black font-sans text-sm placeholder:text-black/40 focus:outline-none focus:border-accent transition-colors"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 border-2 border-black hover:bg-black hover:text-white text-black transition-colors"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      ) : null}
    </form>
  );
}
