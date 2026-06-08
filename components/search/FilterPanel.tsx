'use client';

import React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import type { SearchFilters } from '@/types/paper';

type FilterPanelProps = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
};

const FIELDS_OF_STUDY = ['Computer Science', 'Biology', 'Physics', 'Medicine', 'Psychology', 'Economics', 'Mathematics', 'Engineering'];
const METHODOLOGY_TAGS = ['Quantitative', 'Qualitative', 'Experimental', 'Observational', 'Mixed Methods', 'Meta-Analysis', 'Systematic Review'];

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-6 border-b-2 border-black last:border-0">
      <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black mb-4">{label}</p>
      {children}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="flex items-center gap-3 py-1.5 group cursor-pointer" onClick={() => onChange(!checked)}>
      <Checkbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="w-5 h-5 rounded-none border-2 border-black bg-white focus:outline-none data-[state=checked]:bg-black transition-colors"
      >
        <Checkbox.Indicator>
          <Check size={12} strokeWidth={4} className="text-white mx-auto" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <label htmlFor={id} className="text-xs font-sans font-bold uppercase tracking-tight text-black/60 group-hover:text-black cursor-pointer transition-colors leading-none">
        {label}
      </label>
    </div>
  );
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const recencyOptions = [
    { value: 'last_year' as const, label: 'Last year' },
    { value: 'last_5_years' as const, label: 'Last 5 years' },
    { value: 'last_10_years' as const, label: 'Last 10 years' },
    { value: 'all' as const, label: 'All time' },
  ];

  function toggleField(field: string) {
    const current = filters.fieldsOfStudy ?? [];
    const next = current.includes(field) ? current.filter((f) => f !== field) : [...current, field];
    onChange({ ...filters, fieldsOfStudy: next });
  }

  function toggleMethodology(method: string) {
    const current = filters.methodology ?? [];
    const next = current.includes(method) ? current.filter((m) => m !== method) : [...current, method];
    onChange({ ...filters, methodology: next });
  }

  return (
    <aside aria-label="Search filters" className="w-full lg:w-[240px] flex-shrink-0 bg-white border-2 border-black p-6 space-y-6 self-start shadow-impact">
      <FilterSection label="Time Horizon">
        <div className="space-y-2">
          {recencyOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 py-1.5 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="recency"
                  value={opt.value}
                  checked={filters.recency === opt.value}
                  onChange={() => onChange({ ...filters, recency: opt.value })}
                  className="peer appearance-none w-5 h-5 border-2 border-black rounded-none checked:bg-black transition-all cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 pointer-events-none">
                   <div className="w-2 h-2 bg-white" />
                </div>
              </div>
              <span className="text-xs font-sans font-bold uppercase tracking-tight text-black/60 group-hover:text-black transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Access Type">
        <CheckItem
          label="Open access only"
          checked={filters.openAccessOnly ?? false}
          onChange={(v) => onChange({ ...filters, openAccessOnly: v })}
        />
      </FilterSection>

      <FilterSection label="Disciplinary Domain">
        <div className="space-y-1">
          {FIELDS_OF_STUDY.map((field) => (
            <CheckItem
              key={field}
              label={field}
              checked={(filters.fieldsOfStudy ?? []).includes(field)}
              onChange={() => toggleField(field)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Research Method">
        <div className="space-y-1">
          {METHODOLOGY_TAGS.map((method) => (
            <CheckItem
              key={method}
              label={method}
              checked={(filters.methodology ?? []).includes(method)}
              onChange={() => toggleMethodology(method)}
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}
