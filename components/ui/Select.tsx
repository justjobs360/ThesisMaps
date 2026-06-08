'use client';

import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import React from 'react';

type SelectOption = { value: string; label: string };

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export function Select({ value, onValueChange, options, placeholder = 'Select…', label, disabled }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label ? <label className="text-sm font-medium text-text-primary font-sans">{label}</label> : null}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger className="flex h-9 w-full items-center justify-between gap-2 rounded border border-border bg-surface px-3 py-2 text-sm font-sans text-text-primary focus:outline-none focus:ring-2 focus:ring-accent data-[placeholder]:text-text-muted disabled:opacity-50">
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown size={14} strokeWidth={1.5} className="text-text-muted" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface shadow-md">
            <RadixSelect.Viewport className="p-1">
              {options.map((opt) => (
                <RadixSelect.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-pointer items-center rounded px-3 py-1.5 text-sm font-sans text-text-primary select-none hover:bg-background focus:bg-background focus:outline-none data-[highlighted]:bg-background"
                >
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute right-2">
                    <Check size={12} strokeWidth={1.5} className="text-accent" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
